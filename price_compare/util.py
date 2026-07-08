from __future__ import annotations

import hashlib


def stable_id(platform: str, title: str, url: str) -> str:
    h = hashlib.sha256()
    h.update(platform.encode("utf-8"))
    h.update(b"\n")
    h.update(title.strip().lower().encode("utf-8"))
    h.update(b"\n")
    h.update(url.strip().encode("utf-8"))
    return h.hexdigest()[:24]
