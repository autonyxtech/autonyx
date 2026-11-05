from __future__ import annotations

from typing import TypedDict


class ChatState(TypedDict, total=False):
    session_id: str
    message: str
    messages: list[dict[str, str]]
    reply: str
