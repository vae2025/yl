from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal


@dataclass(frozen=True)
class LogEvent:
    ts: str
    level: Literal["info", "warn", "error"]
    message: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
