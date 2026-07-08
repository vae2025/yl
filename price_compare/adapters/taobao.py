from __future__ import annotations

from typing import Iterable
from urllib.parse import quote

from ._playwright import chromium_page
from .base import Adapter
from ..models import ProductItem
from ..util import stable_id


class TaobaoAdapter(Adapter):
    platform = "taobao"

    async def search(self, keyword: str, limit: int) -> Iterable[ProductItem]:
        url = f"https://s.taobao.com/search?q={quote(keyword)}"
        async with chromium_page() as page:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await page.wait_for_timeout(1200)
            items = await page.evaluate(
                """
                (limit) => {
                  const cards = Array.from(document.querySelectorAll('[data-spm^="ditem"]')).slice(0, limit);
                  const rows = [];
                  for (const c of cards) {
                    const a = c.querySelector('a[href*="item.taobao.com/item.htm"]');
                    const titleEl = c.querySelector('a[title]') || a;
                    const priceEl = c.querySelector('[class*="Price--priceInt"], .price, [data-price]');
                    const ratingEl = c.querySelector('[class*="ShopInfo--shopInfo"] [class*="text"], [class*="ShopInfo--shopDsr"]');
                    const title = (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '').replace(/\\s+/g,' ').trim();
                    let href = a ? a.getAttribute('href') : '';
                    if (href && href.startsWith('//')) href = 'https:' + href;
                    let priceTxt = '';
                    if (priceEl) {
                      priceTxt = (priceEl.getAttribute('data-price') || priceEl.textContent || '').trim();
                    }
                    const ratingTxt = ratingEl ? ratingEl.textContent.trim() : '';
                    rows.push({ title, href, priceTxt, ratingTxt });
                  }
                  return rows;
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
            price_txt = str(it.get("priceTxt", "")).replace(",", "").strip()
            try:
                price = float(price_txt)
            except Exception:
                continue
            shop_rating = None
            rating_txt = str(it.get("ratingTxt", "")).strip()
            if rating_txt:
                try:
                    shop_rating = float(rating_txt)
                except Exception:
                    shop_rating = None
            out.append(
                ProductItem(
                    id=stable_id("taobao", title, href),
                    platform="taobao",
                    title=title,
                    price=price,
                    shop_rating=shop_rating,
                    url=href,
                )
            )
        return out[:limit]
