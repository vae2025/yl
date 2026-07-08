from __future__ import annotations

import hashlib
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .models import ProductItem


SCHEMA = """
CREATE TABLE IF NOT EXISTS product_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  sales INTEGER,
  shop_rating REAL,
  url TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_snapshot_keyword_time
  ON product_snapshot(keyword, fetched_at);

CREATE INDEX IF NOT EXISTS idx_product_snapshot_product_time
  ON product_snapshot(product_id, fetched_at);
"""


def _snapshot_id(product_id: str, fetched_at: str) -> str:
    h = hashlib.sha256()
    h.update(product_id.encode("utf-8"))
    h.update(b"\n")
    h.update(fetched_at.encode("utf-8"))
    return h.hexdigest()[:24]


@dataclass(frozen=True)
class TrendPoint:
    ts: str
    value: float


@dataclass(frozen=True)
class TrendSeries:
    product_id: str
    title: str
    points: list[TrendPoint]


class Store:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as con:
            con.executescript(SCHEMA)

    def write_snapshots(self, keyword: str, items: Iterable[ProductItem]) -> None:
        rows = []
        for it in items:
            sid = _snapshot_id(it.id, it.fetched_at)
            rows.append(
                (
                    sid,
                    it.id,
                    keyword,
                    it.platform,
                    it.title,
                    it.price,
                    it.sales,
                    it.shop_rating,
                    it.url,
                    it.fetched_at,
                )
            )
        with sqlite3.connect(self.db_path) as con:
            con.executemany(
                """
                INSERT OR REPLACE INTO product_snapshot(
                  snapshot_id, product_id, keyword, platform, title, price, sales, shop_rating, url, fetched_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
            )

    def trend_by_keyword(self, keyword: str, *, limit_products: int = 5) -> list[TrendSeries]:
        with sqlite3.connect(self.db_path) as con:
            con.row_factory = sqlite3.Row
            products = con.execute(
                """
                SELECT product_id, title, MIN(price) AS min_price
                FROM product_snapshot
                WHERE keyword = ?
                GROUP BY product_id, title
                ORDER BY min_price ASC
                LIMIT ?
                """,
                (keyword, limit_products),
            ).fetchall()

            out: list[TrendSeries] = []
            for p in products:
                points_rows = con.execute(
                    """
                    SELECT fetched_at, price
                    FROM product_snapshot
                    WHERE keyword = ? AND product_id = ?
                    ORDER BY fetched_at ASC
                    """,
                    (keyword, p["product_id"]),
                ).fetchall()
                out.append(
                    TrendSeries(
                        product_id=p["product_id"],
                        title=p["title"],
                        points=[TrendPoint(ts=r["fetched_at"], value=float(r["price"])) for r in points_rows],
                    )
                )
            return out
