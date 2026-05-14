from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from .base import Adapter
from ..models import ProductItem
from ..util import stable_id


class DemoAdapter(Adapter):
    platform = "demo"

    def __init__(self, data_path: Path | None = None) -> None:
        self._data_path = data_path or (Path(__file__).resolve().parents[1] / "data" / "demo_products.json")

    async def search(self, keyword: str, limit: int) -> Iterable[ProductItem]:
        raw = json.loads(self._data_path.read_text(encoding="utf-8"))
        keyword_lower = keyword.strip().lower()
        matched = []
        for row in raw:
            title = str(row.get("title", "")).strip()
            if keyword_lower and keyword_lower not in title.lower():
                continue
            url = str(row.get("url", "")).strip() or "https://example.com/"
            price = float(row.get("price", 0.0))
            sales = row.get("sales")
            shop_rating = row.get("shop_rating")
            matched.append(
                ProductItem(
                    id=stable_id("demo", title, url),
                    platform="demo",
                    title=title,
                    price=price,
                    sales=int(sales) if sales is not None else None,
                    shop_rating=float(shop_rating) if shop_rating is not None else None,
                    url=url,
                )
            )
        return matched[:limit]
