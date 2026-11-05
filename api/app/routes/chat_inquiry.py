from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.agents.memory.store import get_memory_store
from app.core.config import get_settings
from app.services.email import send_chat_inquiry_notification, send_visitor_confirmation
from app.services.lead_store import save_lead

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatInquiryPayload(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=2, max_length=120)
    business_name: str = Field(default='', max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=30)


class ChatInquiryResponse(BaseModel):
    status: str
    email_sent: bool
    confirmation_sent: bool


@router.post('/chat-inquiry')
async def chat_inquiry(payload: ChatInquiryPayload) -> ChatInquiryResponse:
    """Accept an in-chat inquiry form submission.

    Fetches the chat transcript from memory, stores the inquiry,
    and sends email with lead details + conversation history.
    """
    settings = get_settings()
    store = get_memory_store()
    transcript = store.get_transcript(payload.session_id)

    inquiry_data = payload.model_dump()
    inquiry_data['transcript_length'] = len(transcript)
    inquiry_data['need'] = 'Website chat inquiry'
    save_lead(inquiry_data, 'chat')

    # Send business notification with transcript
    email_sent = await send_chat_inquiry_notification(
        inquiry=inquiry_data,
        transcript=transcript,
        settings=settings,
    )

    # Send visitor confirmation
    confirmation_sent = await send_visitor_confirmation(
        visitor_email=payload.email,
        visitor_name=payload.name,
        settings=settings,
    )

    if email_sent:
        logger.info(
            'Chat inquiry notification sent session_id=%s name=%s',
            payload.session_id,
            payload.name,
        )
    else:
        logger.warning(
            'Chat inquiry saved but email delivery failed session_id=%s',
            payload.session_id,
        )

    return ChatInquiryResponse(
        status='accepted',
        email_sent=email_sent,
        confirmation_sent=confirmation_sent,
    )
