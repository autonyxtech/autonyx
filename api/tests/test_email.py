from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import Settings
from app.services.email import _build_message, _send


@pytest.mark.asyncio
async def test_smtp_is_disabled_by_default_even_when_credentials_are_configured() -> None:
    settings = Settings(
        smtp_host='smtp.example.com',
        smtp_username='configured-user',
        smtp_password='configured-password',
        email_from='sender@example.com',
        email_to='owner@example.com',
    )
    message = _build_message(
        settings,
        subject='Test',
        to_email='visitor@example.com',
        text_body='Test email',
        html_body='<p>Test email</p>',
    )

    with patch('aiosmtplib.send', new_callable=AsyncMock) as send:
        result = await _send(message, settings)

    assert result is False
    send.assert_not_awaited()
