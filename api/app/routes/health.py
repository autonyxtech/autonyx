from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get('/health')
async def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        'status': 'ok',
        'chat_configured': bool(settings.llm_api_key.strip()),
        'llm_provider': settings.llm_provider,
    }
