from __future__ import annotations

import hashlib
import hmac
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.services.lead_store import (
    delete_lead,
    get_website_visit_count,
    list_leads,
    record_website_visit,
)

router = APIRouter()
logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)
SESSION_DURATION_SECONDS = 8 * 60 * 60


class AdminLoginPayload(BaseModel):
    password: str = Field(..., min_length=1, max_length=256)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    password = get_settings().admin_password
    if not password or credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Admin authentication required')

    try:
        expires_at, supplied_signature = credentials.credentials.split('.', 1)
        if int(expires_at) < int(time.time()):
            raise ValueError('Expired token')
    except ValueError:
        raise HTTPException(status_code=401, detail='Invalid or expired admin session') from None

    expected_signature = hmac.new(
        password.encode(),
        expires_at.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(supplied_signature, expected_signature):
        raise HTTPException(status_code=401, detail='Invalid or expired admin session')


@router.post('/admin/login')
@limiter.limit('5/minute')
async def admin_login(
    request: Request,
    response: Response,
    payload: AdminLoginPayload,
) -> dict[str, str]:
    password = get_settings().admin_password
    if not password:
        logger.error('Admin dashboard login rejected because ADMIN_PASSWORD is not configured')
        raise HTTPException(status_code=503, detail='Admin dashboard is not configured')
    if not hmac.compare_digest(payload.password.encode(), password.encode()):
        raise HTTPException(status_code=401, detail='Incorrect password')

    expires_at = str(int(time.time()) + SESSION_DURATION_SECONDS)
    signature = hmac.new(password.encode(), expires_at.encode(), hashlib.sha256).hexdigest()
    return {'token': f'{expires_at}.{signature}'}


@router.get('/admin/leads', dependencies=[Depends(require_admin)])
async def admin_leads(response: Response) -> dict[str, list[dict]]:
    response.headers['Cache-Control'] = 'no-store'
    return {'leads': list_leads()}


@router.delete('/admin/leads/{lead_id}', status_code=204, dependencies=[Depends(require_admin)])
async def admin_delete_lead(lead_id: int) -> Response:
    if not delete_lead(lead_id):
        raise HTTPException(status_code=404, detail='Inquiry not found')
    return Response(status_code=204, headers={'Cache-Control': 'no-store'})


@router.get('/admin/analytics', dependencies=[Depends(require_admin)])
async def admin_analytics(response: Response) -> dict[str, int]:
    response.headers['Cache-Control'] = 'no-store'
    return {'website_visits': get_website_visit_count()}


@router.post('/analytics/visit', status_code=204)
async def record_visit() -> None:
    record_website_visit()
