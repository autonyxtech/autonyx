from __future__ import annotations

import time
from threading import RLock


class ChatMemoryStore:
    def __init__(self, ttl_seconds: int = 3600, max_messages: int = 20) -> None:
        self._ttl_seconds = ttl_seconds
        self._max_messages = max_messages
        self._messages: dict[str, list[dict[str, str]]] = {}
        self._updated_at: dict[str, float] = {}
        self._lock = RLock()

    def _is_expired(self, session_id: str, now: float | None = None) -> bool:
        now = now or time.monotonic()
        return now - self._updated_at.get(session_id, 0) > self._ttl_seconds

    def get_history(self, session_id: str) -> list[dict[str, str]]:
        now = time.monotonic()
        with self._lock:
            if self._is_expired(session_id, now):
                self._messages.pop(session_id, None)
                self._updated_at.pop(session_id, None)
                return []
            return [message.copy() for message in self._messages.get(session_id, [])]

    def add_turn(self, session_id: str, user_message: str, assistant_reply: str) -> None:
        now = time.monotonic()
        with self._lock:
            if self._is_expired(session_id, now):
                self._messages.pop(session_id, None)
            history = self._messages.setdefault(session_id, [])
            history.extend([
                {'role': 'user', 'content': user_message},
                {'role': 'assistant', 'content': assistant_reply},
            ])
            self._messages[session_id] = history[-self._max_messages:]
            self._updated_at[session_id] = now

    def get_user_message_count(self, session_id: str) -> int:
        """Count the number of user messages in a session (excluding expired)."""
        with self._lock:
            if self._is_expired(session_id):
                return 0
            history = self._messages.get(session_id, [])
            return sum(1 for msg in history if msg.get('role') == 'user')

    def get_transcript(self, session_id: str) -> list[dict[str, str]]:
        """Return the full conversation as a list of {role, content} dicts for email."""
        return self.get_history(session_id)

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._messages.pop(session_id, None)
            self._updated_at.pop(session_id, None)


_memory_store: ChatMemoryStore | None = None
_memory_store_lock = RLock()


def get_memory_store() -> ChatMemoryStore:
    global _memory_store
    if _memory_store is None:
        from app.core.config import get_settings

        settings = get_settings()
        with _memory_store_lock:
            if _memory_store is None:
                _memory_store = ChatMemoryStore(
                    ttl_seconds=settings.chat_session_ttl_seconds,
                    max_messages=settings.chat_max_history_messages,
                )
    return _memory_store
