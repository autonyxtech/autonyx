from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings
from app.core.rate_limit import consume_daily_chat_usage, limiter
from app.agents.graph import stream_chat

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=1000)

    @field_validator('message', mode='before')
    @classmethod
    def strip_message(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


@router.post('/chat')
@limiter.limit(f'{get_settings().rate_limit_per_minute}/minute')
@limiter.limit(f'{get_settings().rate_limit_per_hour}/hour')
async def chat(request: Request, payload: ChatRequest) -> StreamingResponse:
    consume_daily_chat_usage()

    async def event_generator():
        try:
            async for event in stream_chat(payload.session_id, payload.message):
                event_type = event.get('type', '')
                if event_type in ('chunk', 'show_lead_form'):
                    yield f'data: {json.dumps(event)}\n\n'
            yield f'data: {json.dumps({"type": "done"})}\n\n'
        except Exception as exc:
            logger.error(
                'Chat generation failed session_id=%s error_type=%s provider_status=%s',
                payload.session_id,
                type(exc).__name__,
                getattr(exc, 'status_code', None),
            )
            yield f'data: {json.dumps({"type": "error", "text": "The assistant is temporarily unavailable. Please try again shortly or contact our team."})}\n\n'

    return StreamingResponse(event_generator(), media_type='text/event-stream')
