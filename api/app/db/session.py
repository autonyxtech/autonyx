from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine, create_engine

from app.core.config import Settings, get_settings


def get_database_url(settings: Settings | None = None) -> str:
    current_settings = settings or get_settings()
    configured_url = getattr(current_settings, 'database_url', '').strip()
    if configured_url:
        if configured_url.startswith('postgres://'):
            return configured_url.replace('postgres://', 'postgresql+psycopg://', 1)
        if configured_url.startswith('postgresql://'):
            return configured_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        return configured_url

    database_path = Path(current_settings.leads_database_path)
    if not database_path.is_absolute():
        database_path = Path(__file__).resolve().parents[2] / database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
    return f'sqlite:///{database_path.as_posix()}'


@lru_cache(maxsize=8)
def _engine_for_url(database_url: str) -> Engine:
    if database_url.startswith('sqlite:'):
        return create_engine(
            database_url,
            connect_args={'check_same_thread': False, 'timeout': 10},
            pool_pre_ping=True,
        )
    return create_engine(database_url, pool_pre_ping=True, pool_size=1, max_overflow=0)


def get_engine() -> Engine:
    return _engine_for_url(get_database_url())
