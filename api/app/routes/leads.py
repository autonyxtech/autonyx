from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.core.config import get_settings
from app.services.email import send_lead_notification, send_visitor_confirmation
from app.services.lead_store import save_lead

router = APIRouter()
logger = logging.getLogger(__name__)

class LeadPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=30)
    business_name: str = Field(default='', max_length=120)
    business_type: str | None = Field(default=None, max_length=80)
    interests: list[str] = Field(default_factory=list)
    need: str = Field(..., min_length=4, max_length=600)
    package: str | None = Field(default=None, max_length=80)
    preferred_day: str | None = Field(default=None, max_length=40)
    time_range: str | None = Field(default=None, max_length=40)
    timezone: str | None = Field(default=None, max_length=60)
    message: str | None = Field(default=None, max_length=400)
    source_page: str | None = Field(default=None, max_length=140)
    consent: bool = True
    website: str = Field(default='', max_length=500)  # honeypot


class LeadResponse(BaseModel):
    status: str
    email_sent: bool
    confirmation_sent: bool


@router.post('/leads')
async def create_lead(payload: LeadPayload) -> LeadResponse:
    # Honeypot check — bots often fill this hidden field
    if payload.website:
        return LeadResponse(status='accepted', email_sent=False, confirmation_sent=False)

    lead_data = payload.model_dump()
    save_lead(lead_data, 'booking')

    settings = get_settings()

    # Send notification email to business owner
    email_sent = await send_lead_notification(lead_data, settings)

    # Send confirmation email to visitor
    confirmation_sent = await send_visitor_confirmation(
        visitor_email=payload.email,
        visitor_name=payload.name,
        settings=settings,
    )

    if email_sent:
        logger.info('Lead notification sent name=%s email=%s', payload.name, payload.email)
    else:
        logger.warning('Lead saved but notification email failed name=%s', payload.name)

    return LeadResponse(
        status='accepted',
        email_sent=email_sent,
        confirmation_sent=confirmation_sent,
    )
