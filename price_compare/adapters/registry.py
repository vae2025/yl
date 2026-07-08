from __future__ import annotations

from pathlib import Path

from ..models import Platform
from .base import Adapter
from .demo import DemoAdapter
from .jd import JdAdapter
from .pdd import PddAdapter
from .taobao import TaobaoAdapter


def get_adapter(platform: Platform, *, data_path: Path | None = None) -> Adapter:
    if platform == "demo":
        return DemoAdapter(data_path=data_path)
    if platform == "jd":
        return JdAdapter()
    if platform == "taobao":
        return TaobaoAdapter()
    if platform == "pdd":
        return PddAdapter()
    raise ValueError(f"Unsupported platform: {platform}")
