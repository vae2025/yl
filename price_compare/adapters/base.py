from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from ..models import Platform, ProductItem


class Adapter(ABC):
    platform: Platform

    @abstractmethod
    async def search(self, keyword: str, limit: int) -> Iterable[ProductItem]:
        raise NotImplementedError
