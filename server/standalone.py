from __future__ import annotations

import argparse
import asyncio
import json
import mimetypes
import os
import threading
from dataclasses import asdict, dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Literal, Optional
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from price_compare.exporter import export_csv, export_html_report, export_json
from price_compare.models import Platform, RunConfig
from price_compare.pipeline import Processed, process
from price_compare.scraper import run_collect
from price_compare.storage import Store


@dataclass
class TaskState:
    task_id: str
    keyword: str
    status: Literal["queued", "running", "succeeded", "failed"] = "queued"
    logs: list[dict] = field(default_factory=list)
    error: Optional[str] = None
    processed: Optional[Processed] = None


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
DB_PATH = OUTPUTS / "price_compare.sqlite3"
TASK_DIR = OUTPUTS / "tasks"
STATIC_DIR = ROOT / "web" / "dist"

store = Store(DB_PATH)
tasks: dict[str, TaskState] = {}


def _coerce_platforms(v) -> list[Platform]:
    if not isinstance(v, list):
        return []
    out: list[Platform] = []
    for x in v:
        if x in ("jd", "taobao", "pdd", "demo"):
            out.append(x)
    return out


def _append_log(task: TaskState, evt) -> None:
    task.logs.append(asdict(evt))


def _run_task(task: TaskState, payload: dict) -> None:
    task.status = "running"
    try:
        keyword = str(payload.get("keyword", "")).strip()
        platforms = _coerce_platforms(payload.get("platforms", ["demo"]))
        demo_mode = bool(payload.get("demoMode", False))
        if demo_mode:
            platforms = ["demo"]
        if not platforms:
            platforms = ["demo"]

        cfg = RunConfig(
            keyword=keyword,
            platforms=platforms,
            limit_per_platform=int(payload.get("limitPerPlatform", 20)),
            concurrency=int(payload.get("concurrency", 3)),
            demo_mode=demo_mode,
        )
        scraped = asyncio.run(run_collect(cfg, log_sink=lambda e: _append_log(task, e)))
        task.processed = process(scraped.items)
        store.write_snapshots(keyword, task.processed.items)
        task.status = "succeeded"
    except Exception as e:
        task.status = "failed"
        task.error = str(e)


class Handler(BaseHTTPRequestHandler):
    server_version = "price-compare-standalone"

    def _send_json(self, status: int, data: dict) -> None:
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _send_bytes(self, status: int, data: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("content-type", content_type)
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json_body(self) -> dict:
        try:
            length = int(self.headers.get("content-length", "0"))
        except Exception:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b""
        if not raw:
            return {}
        parsed = json.loads(raw.decode("utf-8"))
        return parsed if isinstance(parsed, dict) else {}

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._send_json(200, {"ok": True})
            return

        if parsed.path.startswith("/api/task/"):
            parts = parsed.path.split("/")
            if len(parts) >= 4:
                task_id = parts[3]
                sub = "/".join(parts[4:]) if len(parts) > 4 else ""
                if sub == "" and len(parts) == 4:
                    task = tasks.get(task_id)
                    if not task:
                        self._send_json(404, {"error": "task not found"})
                        return
                    self._send_json(
                        200,
                        {"taskId": task.task_id, "status": task.status, "logs": task.logs, "error": task.error},
                    )
                    return
                if sub == "result":
                    task = tasks.get(task_id)
                    if not task:
                        self._send_json(404, {"error": "task not found"})
                        return
                    if task.status != "succeeded" or not task.processed:
                        self._send_json(409, {"error": "task not finished"})
                        return
                    items = [it.__dict__ for it in task.processed.items]
                    summary = {
                        "total": len(items),
                        "lowestPrice": min([it["price"] for it in items], default=None),
                        "recommendedIds": task.processed.recommended_ids,
                    }
                    self._send_json(200, {"keyword": task.keyword, "items": items, "summary": summary})
                    return
                if sub == "trend":
                    task = tasks.get(task_id)
                    if not task:
                        self._send_json(404, {"error": "task not found"})
                        return
                    series = store.trend_by_keyword(task.keyword)
                    payload = {
                        "keyword": task.keyword,
                        "series": [
                            {
                                "productId": s.product_id,
                                "title": s.title,
                                "points": [{"ts": p.ts, "value": p.value} for p in s.points],
                            }
                            for s in series
                        ],
                    }
                    self._send_json(200, payload)
                    return
                if sub == "export":
                    task = tasks.get(task_id)
                    if not task:
                        self._send_json(404, {"error": "task not found"})
                        return
                    if task.status != "succeeded" or not task.processed:
                        self._send_json(409, {"error": "task not finished"})
                        return
                    q = parse_qs(parsed.query or "")
                    fmt = (q.get("format", ["json"])[0] or "json").lower()
                    if fmt not in ("json", "csv", "html"):
                        self._send_json(400, {"error": "unsupported format"})
                        return

                    TASK_DIR.mkdir(parents=True, exist_ok=True)
                    dir_path = TASK_DIR / task_id
                    dir_path.mkdir(parents=True, exist_ok=True)
                    stem = "result"
                    if fmt == "json":
                        path = dir_path / f"{stem}.json"
                        export_json(
                            path,
                            keyword=task.keyword,
                            items=task.processed.items,
                            recommended_ids=task.processed.recommended_ids,
                        )
                    elif fmt == "csv":
                        path = dir_path / f"{stem}.csv"
                        export_csv(path, items=task.processed.items)
                    else:
                        path = dir_path / f"{stem}.report.html"
                        trend = store.trend_by_keyword(task.keyword)
                        export_html_report(
                            path,
                            keyword=task.keyword,
                            items=task.processed.items,
                            recommended_ids=task.processed.recommended_ids,
                            trend=trend,
                        )

                    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
                    data = path.read_bytes()
                    self.send_response(200)
                    self.send_header("content-type", content_type)
                    self.send_header("content-length", str(len(data)))
                    self.send_header("content-disposition", f'attachment; filename="{path.name}"')
                    self.end_headers()
                    self.wfile.write(data)
                    return

        self._serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/run":
            body = self._read_json_body()
            keyword = str(body.get("keyword", "")).strip()
            if not keyword:
                self._send_json(400, {"error": "keyword is required"})
                return
            task_id = uuid4().hex
            task = TaskState(task_id=task_id, keyword=keyword)
            tasks[task_id] = task
            t = threading.Thread(target=_run_task, args=(task, body), daemon=True)
            t.start()
            self._send_json(200, {"taskId": task_id})
            return
        self._send_json(404, {"error": "not found"})

    def _serve_static(self, path: str) -> None:
        if not STATIC_DIR.exists():
            self._send_bytes(HTTPStatus.NOT_FOUND, b"web/dist not found", "text/plain; charset=utf-8")
            return
        rel = path.lstrip("/") or "index.html"
        file_path = (STATIC_DIR / rel).resolve()
        if not str(file_path).startswith(str(STATIC_DIR.resolve())):
            self._send_bytes(HTTPStatus.FORBIDDEN, b"forbidden", "text/plain; charset=utf-8")
            return
        if file_path.is_dir():
            file_path = file_path / "index.html"
        if not file_path.exists():
            file_path = STATIC_DIR / "index.html"
        data = file_path.read_bytes()
        ctype = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype = f"{ctype}; charset=utf-8"
        self._send_bytes(HTTPStatus.OK, data, ctype)

    def log_message(self, format: str, *args) -> None:
        return


def main(argv: list[str] | None = None) -> int:
    mimetypes.init()
    parser = argparse.ArgumentParser(prog="price-compare-standalone")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "5173")))
    args = parser.parse_args(argv)

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

