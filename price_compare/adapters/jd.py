from __future__ import annotations

from typing import Iterable
from urllib.parse import quote

from ._playwright import chromium_page
from .base import Adapter
from ..models import ProductItem
from ..util import stable_id


class JdAdapter(Adapter):
    platform = "jd"

    async def search(self, keyword: str, limit: int) -> Iterable[ProductItem]:
        url = f"https://search.jd.com/Search?keyword={quote(keyword)}&enc=utf-8"
        async with chromium_page() as page:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await page.wait_for_timeout(800)
            items = await page.evaluate(
                """
                (limit) => {
                  const rows = [];
                  const nodes = Array.from(document.querySelectorAll('li.gl-item')).slice(0, limit);
                  for (const n of nodes) {
                    const a = n.querySelector('.p-name a');
                    const em = n.querySelector('.p-name em');
                    const priceEl = n.querySelector('.p-price i');
                    const commitEl = n.querySelector('.p-commit a');
                    const title = (em ? em.textContent : (a ? a.textContent : '')).replace(/\\s+/g,' ').trim();
                    let href = a ? a.getAttribute('href') : '';
                    if (href && href.startsWith('//')) href = 'https:' + href;
                    const priceTxt = priceEl ? priceEl.textContent : '';
                    const commitTxt = commitEl ? commitEl.textContent : '';
                    rows.push({ title, href, priceTxt, commitTxt });
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
            sales = None
            commit_txt = str(it.get("commitTxt", "")).strip()
            if commit_txt:
                commit_txt = commit_txt.replace("+", "")
                try:
                    sales = int(float(commit_txt.replace("万", "")) * (10000 if "万" in it.get("commitTxt", "") else 1))
                except Exception:
                    sales = None
            out.append(
                ProductItem(
                    id=stable_id("jd", title, href),
                    platform="jd",
                    title=title,
                    price=price,
                    sales=sales,
                    url=href,
                )
            )
        return out[:limit]
