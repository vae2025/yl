from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .exporter import export_csv, export_html_report, export_json
from .models import RunConfig
from .pipeline import process
from .scraper import run_collect
from .storage import Store


def _parse_platforms(v: str) -> list[str]:
    parts = [p.strip() for p in v.split(",") if p.strip()]
    return parts


def _read_keywords(path: Path) -> list[str]:
    lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines()]
    return [x for x in lines if x and not x.startswith("#")]


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="price-compare", description="电商商品价格自动化采集与对比工具")
    p.add_argument("--keyword", help="搜索关键词")
    p.add_argument("--keywords-file", help="关键词文件（每行一个）")
    p.add_argument("--platforms", default="", help="平台列表：jd,taobao,pdd,demo（逗号分隔）")
    p.add_argument("--limit", type=int, default=20, help="每个平台抓取条数")
    p.add_argument("--concurrency", type=int, default=3, help="并发数")
    p.add_argument("--demo", action="store_true", help="使用演示数据模式（不访问外网）")
    p.add_argument("--out", default="outputs", help="输出目录")
    p.add_argument("--db", default="outputs/price_compare.sqlite3", help="SQLite 历史库路径")
    p.add_argument("--export", default="all", choices=["all", "json", "csv", "html", "none"], help="导出格式")
    p.add_argument("--data", default="", help="演示数据 JSON 路径（可选）")
    return p


async def _run_one(keyword: str, args: argparse.Namespace) -> int:
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    db_path = Path(args.db)
    store = Store(db_path)

    platforms = _parse_platforms(args.platforms)
    if args.demo or not platforms:
        platforms = ["demo"]

    data_path = Path(args.data) if args.data else None
    config = RunConfig(
        keyword=keyword,
        platforms=platforms,
        limit_per_platform=int(args.limit),
        concurrency=int(args.concurrency),
        demo_mode=bool(args.demo),
    )
    scraped = await run_collect(config, data_path=data_path)
    processed = process(scraped.items)
    store.write_snapshots(keyword, processed.items)
    trend = store.trend_by_keyword(keyword)

    stem = "".join([c for c in keyword if c.isalnum() or c in ("-", "_")])[:40] or "keyword"
    json_path = out_dir / f"{stem}.json"
    csv_path = out_dir / f"{stem}.csv"
    html_path = out_dir / f"{stem}.report.html"

    if args.export in ("all", "json"):
        export_json(json_path, keyword=keyword, items=processed.items, recommended_ids=processed.recommended_ids)
    if args.export in ("all", "csv"):
        export_csv(csv_path, items=processed.items)
    if args.export in ("all", "html"):
        export_html_report(
            html_path,
            keyword=keyword,
            items=processed.items,
            recommended_ids=processed.recommended_ids,
            trend=trend,
        )

    for evt in scraped.logs:
        print(f"[{evt.ts}] {evt.level.upper():5s} {evt.message}")
    print(f"输出目录：{out_dir.resolve()}")
    if args.export in ("all", "json"):
        print(f"JSON：{json_path.resolve()}")
    if args.export in ("all", "csv"):
        print(f"CSV：{csv_path.resolve()}")
    if args.export in ("all", "html"):
        print(f"HTML：{html_path.resolve()}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    keywords: list[str] = []
    if args.keyword:
        keywords.append(args.keyword)
    if args.keywords_file:
        keywords.extend(_read_keywords(Path(args.keywords_file)))

    keywords = [k.strip() for k in keywords if k.strip()]
    if not keywords:
        parser.print_help()
        return 2

    for k in keywords:
        asyncio.run(_run_one(k, args))
    return 0
