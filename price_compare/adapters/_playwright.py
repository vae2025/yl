from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator


class PlaywrightMissing(RuntimeError):
    pass


@asynccontextmanager
async def chromium_page() -> AsyncIterator[object]:
    try:
        from playwright.async_api import async_playwright
    except Exception as e:
        raise PlaywrightMissing(
            "未安装 playwright。请执行：pip install playwright && playwright install chromium"
        ) from e

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="zh-CN",
        )
        page = await context.new_page()
        try:
            yield page
        finally:
            await context.close()
            await browser.close()
