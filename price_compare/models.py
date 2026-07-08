from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal, Optional


Platform = Literal["jd", "taobao", "pdd", "demo"]


@dataclass(frozen=True)
class ProductItem:
    id: str
    platform: Platform
    title: str
    price: float
    url: str
    currency: Literal["CNY"] = "CNY"
    sales: Optional[int] = None
    shop_rating: Optional[float] = None
    fetched_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    score: Optional[float] = None
    tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RunConfig:
    keyword: str
    platforms: list[Platform]
    limit_per_platform: int = 20
    concurrency: int = 3
    demo_mode: bool = False
