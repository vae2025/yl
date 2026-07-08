from __future__ import annotations

import math
import re
from dataclasses import dataclass

from .models import ProductItem


_re_noise = re.compile(r"[\\s\\-_/|,，。！？!?:：;；（）()【】\\[\\]{}<>《》“”\"'`~·]+")


def _norm_title(title: str) -> str:
    return _re_noise.sub("", title.strip().lower())


@dataclass(frozen=True)
class Processed:
    items: list[ProductItem]
    recommended_ids: list[str]


def process(items: list[ProductItem]) -> Processed:
    seen: set[str] = set()
    deduped: list[ProductItem] = []
    for it in items:
        url_key = it.url.strip()
        key = url_key if url_key else f"{it.platform}:{_norm_title(it.title)}"
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)

    scored: list[ProductItem] = []
    for it in deduped:
        price_term = 1.0 / (max(it.price, 0.01))
        sales_term = math.log1p(it.sales or 0) / 10.0
        rating_term = (it.shop_rating or 0.0) / 5.0
        score = price_term * 0.75 + sales_term * 0.15 + rating_term * 0.10
        tags: list[str] = []
        scored.append(
            ProductItem(
                **{**it.__dict__, "score": score, "tags": tags},
            )
        )

    scored.sort(key=lambda x: (x.price, -(x.score or 0.0)))
    recommended = sorted(scored, key=lambda x: (-(x.score or 0.0), x.price))[:3]
    recommended_ids = [x.id for x in recommended]

    final: list[ProductItem] = []
    lowest_price = scored[0].price if scored else None
    for it in scored:
        tags = list(it.tags)
        if lowest_price is not None and it.price == lowest_price:
            tags.append("最低价")
        if it.id in recommended_ids:
            tags.append("推荐")
        final.append(ProductItem(**{**it.__dict__, "tags": tags}))

    return Processed(items=final, recommended_ids=recommended_ids)
