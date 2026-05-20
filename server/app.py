from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal, Optional, TypedDict
from uuid import uuid4

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import FileResponse, JSONResponse, PlainTextResponse
from starlette.routing import Route

from price_compare.exporter import export_csv, export_html_report, export_json
from price_compare.models import Platform, RunConfig
from price_compare.pipeline import Processed, process
from price_compare.scraper import run_collect
from price_compare.storage import Store


class RunRequest(TypedDict, total=False):
    keyword: str
    platforms: list[Platform]
    limitPerPlatform: int
    concurrency: int
    demoMode: bool


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

store = Store(DB_PATH)
tasks: dict[str, TaskState] = {}


def _bad_request(msg: str) -> JSONResponse:
    return JSONResponse({"error": msg}, status_code=400)


def _append_log(task: TaskState, evt) -> None:
    task.logs.append(asdict(evt))


def _coerce_platforms(v) -> list[Platform]:
    if not isinstance(v, list):
        return []
    out: list[Platform] = []
    for x in v:
        if x in ("jd", "taobao", "pdd", "demo"):
            out.append(x)
    return out


async def _run_task(task: TaskState, req: RunRequest) -> None:
    task.status = "running"
    try:
        platforms = _coerce_platforms(req.get("platforms", ["demo"]))
        demo_mode = bool(req.get("demoMode", False))
        if demo_mode:
            platforms = ["demo"]
        if not platforms:
            platforms = ["demo"]

        cfg = RunConfig(
            keyword=req["keyword"],
            platforms=platforms,
            limit_per_platform=int(req.get("limitPerPlatform", 20)),
            concurrency=int(req.get("concurrency", 3)),
            demo_mode=demo_mode,
        )
        scraped = await run_collect(cfg, log_sink=lambda e: _append_log(task, e))
        task.processed = process(scraped.items)
        store.write_snapshots(req["keyword"], task.processed.items)
        task.status = "succeeded"
    except Exception as e:
        task.status = "failed"
        task.error = str(e)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"ok": True})


async def run(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        return _bad_request("invalid json")
    if not isinstance(body, dict):
        return _bad_request("invalid payload")

    keyword = str(body.get("keyword", "")).strip()
    if not keyword:
        return _bad_request("keyword is required")

    task_id = uuid4().hex
    task = TaskState(task_id=task_id, keyword=keyword)
    tasks[task_id] = task
    asyncio.create_task(_run_task(task, body))
    return JSONResponse({"taskId": task_id})


async def task_status(_: Request) -> JSONResponse:
    task_id = _.path_params["task_id"]
    task = tasks.get(task_id)
    if not task:
        return JSONResponse({"error": "task not found"}, status_code=404)
    return JSONResponse({"taskId": task.task_id, "status": task.status, "logs": task.logs, "error": task.error})


async def task_result(_: Request) -> JSONResponse:
    task_id = _.path_params["task_id"]
    task = tasks.get(task_id)
    if not task:
        return JSONResponse({"error": "task not found"}, status_code=404)
    if task.status != "succeeded" or not task.processed:
        return JSONResponse({"error": "task not finished"}, status_code=409)

    items = [it.__dict__ for it in task.processed.items]
    summary = {
        "total": len(items),
        "lowestPrice": min([it["price"] for it in items], default=None),
        "recommendedIds": task.processed.recommended_ids,
    }
    return JSONResponse({"keyword": task.keyword, "items": items, "summary": summary})


async def task_trend(_: Request) -> JSONResponse:
    task_id = _.path_params["task_id"]
    task = tasks.get(task_id)
    if not task:
        return JSONResponse({"error": "task not found"}, status_code=404)

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
    return JSONResponse(payload)


async def task_export(request: Request) -> FileResponse | JSONResponse:
    task_id = request.path_params["task_id"]
    fmt = request.query_params.get("format", "json")
    if fmt not in ("json", "csv", "html"):
        return _bad_request("unsupported format")

    task = tasks.get(task_id)
    if not task:
        return JSONResponse({"error": "task not found"}, status_code=404)
    if task.status != "succeeded" or not task.processed:
        return JSONResponse({"error": "task not finished"}, status_code=409)

    TASK_DIR.mkdir(parents=True, exist_ok=True)
    dir_path = TASK_DIR / task_id
    dir_path.mkdir(parents=True, exist_ok=True)

    stem = "result"
    if fmt == "json":
        path = dir_path / f"{stem}.json"
        export_json(path, keyword=task.keyword, items=task.processed.items, recommended_ids=task.processed.recommended_ids)
        return FileResponse(path)
    if fmt == "csv":
        path = dir_path / f"{stem}.csv"
        export_csv(path, items=task.processed.items)
        return FileResponse(path)
    path = dir_path / f"{stem}.report.html"
    trend = store.trend_by_keyword(task.keyword)
    export_html_report(
        path,
        keyword=task.keyword,
        items=task.processed.items,
        recommended_ids=task.processed.recommended_ids,
        trend=trend,
    )
    return FileResponse(path)


routes = [
    Route("/pcapi/health", health, methods=["GET"]),
    Route("/pcapi/run", run, methods=["POST"]),
    Route("/pcapi/task/{task_id:str}", task_status, methods=["GET"]),
    Route("/pcapi/task/{task_id:str}/result", task_result, methods=["GET"]),
    Route("/pcapi/task/{task_id:str}/trend", task_trend, methods=["GET"]),
    Route("/pcapi/task/{task_id:str}/export", task_export, methods=["GET"]),
    Route("/", lambda _: PlainTextResponse("OK"), methods=["GET"]),
]

app = Starlette(routes=routes)
