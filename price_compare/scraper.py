from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Callable, Iterable

from .adapters import get_adapter
from .events import LogEvent, now_iso
from .models import ProductItem, RunConfig


@dataclass(frozen=True)
class ScrapeResult:
    keyword: str
    items: list[ProductItem]
    logs: list[LogEvent]


LogSink = Callable[[LogEvent], None]


async def run_collect(config: RunConfig, *, data_path=None, log_sink: LogSink | None = None) -> ScrapeResult:
    logs: list[LogEvent] = []

    def emit(level: str, message: str) -> None:
        evt = LogEvent(ts=now_iso(), level=level, message=message)
        logs.append(evt)
        if log_sink:
            log_sink(evt)

    emit("info", f"开始采集：keyword={config.keyword} platforms={','.join(config.platforms)}")

    sem = asyncio.Semaphore(max(1, int(config.concurrency)))

    async def run_one(platform: str) -> list[ProductItem]:
        async with sem:
            try:
                emit("info", f"{platform}: 启动采集")
                adapter = get_adapter(platform, data_path=data_path)
                rows = await adapter.search(config.keyword, config.limit_per_platform)
                out = list(rows) if isinstance(rows, Iterable) else []
                emit("info", f"{platform}: 完成，条数={len(out)}")
                return out
            except Exception as e:
                emit("error", f"{platform}: 采集失败：{e}")
                return []

    tasks = [asyncio.create_task(run_one(p)) for p in config.platforms]
    platform_items = await asyncio.gather(*tasks)
    items = [it for group in platform_items for it in group]
    emit("info", f"采集结束：总条数={len(items)}")
    return ScrapeResult(keyword=config.keyword, items=items, logs=logs)
