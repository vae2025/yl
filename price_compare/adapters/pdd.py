from __future__ import annotations

from typing import Iterable
from urllib.parse import quote

from ._playwright import chromium_page
from .base import Adapter
from ..models import ProductItem
from ..util import stable_id


class PddAdapter(Adapter):
    platform = "pdd"

    async def search(self, keyword: str, limit: int) -> Iterable[ProductItem]:
        url = f"https://mobile.yangkeduo.com/search_result.html?search_key={quote(keyword)}"
        async with chromium_page() as page:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await page.wait_for_timeout(1500)
            items = await page.evaluate(
                """
                (limit) => {
                  const rows = [];
                  const links = Array.from(document.querySelectorAll('a[href*="goods.html"]'));
                  for (const a of links) {
                    const card = a.closest('div') || a.parentElement;
                    const titleEl = card ? card.querySelector('[class*="title"], span, div') : null;
                    const priceEl = card ? card.querySelector('[class*="price"], [data-price]') : null;
                    const title = (titleEl ? titleEl.textContent : '').replace(/\\s+/g,' ').trim();
                    const href = a.getAttribute('href') || '';
                    const priceTxt = priceEl ? (priceEl.getAttribute('data-price') || priceEl.textContent || '').trim() : '';
                    if (title && href && priceTxt) rows.push({ title, href, priceTxt });
                    if (rows.length >= limit) break;
                  }
                  return rows.slice(0, limit);
                }
                """,
                limit,
            )

        out: list[ProductItem] = []
        for it in items or []:
            title = str(it.get("title", "")).strip()
            href = str(it.get("href", "")).strip()
            if not title or not href:
                continue
            if href.startswith("//"):
                href = "https:" + href
            if href.startswith("/"):
                href = "https://mobile.yangkeduo.com" + href
            price_txt = str(it.get("priceTxt", "")).replace(",", "").strip()
            price_txt = price_txt.replace("¥", "").strip()
            try:
                price = float(price_txt)
            except Exception:
                continue
            out.append(
                ProductItem(
                    id=stable_id("pdd", title, href),
                    platform="pdd",
                    title=title,
                    price=price,
                    url=href,
                )
            )
        return out[:limit]
