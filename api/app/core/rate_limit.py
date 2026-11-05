from datetime import datetime, timezone
from threading import Lock

from fastapi import HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)
_daily_usage_lock = Lock()
_daily_usage_date = ''
_daily_usage_count = 0


def consume_daily_chat_usage() -> None:
    global _daily_usage_count, _daily_usage_date

    today = datetime.now(timezone.utc).date().isoformat()
    daily_cap = get_settings().daily_usage_cap
    with _daily_usage_lock:
        if _daily_usage_date != today:
            _daily_usage_date = today
            _daily_usage_count = 0
        if _daily_usage_count >= daily_cap:
            raise HTTPException(
                status_code=429,
                detail='The assistant has reached its daily request limit. Please try again tomorrow or contact our team.',
            )
        _daily_usage_count += 1
