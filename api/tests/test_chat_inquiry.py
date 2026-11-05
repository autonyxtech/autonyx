from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.agents.memory import store as memory_module
from app.agents.memory.store import ChatMemoryStore
from app.main import app

client = TestClient(app)


def set_test_memory(monkeypatch) -> ChatMemoryStore:
    memory = ChatMemoryStore(ttl_seconds=3600, max_messages=20)
    monkeypatch.setattr(memory_module, '_memory_store', memory)
    return memory


def test_chat_inquiry_accepts_valid_payload(monkeypatch) -> None:
    memory = set_test_memory(monkeypatch)
    session_id = 'inquiry-session-1'
    memory.add_turn(session_id, 'What packages?', 'We have Launch, AI Growth, and Run.')

    with (
        patch('app.routes.chat_inquiry.send_chat_inquiry_notification', new_callable=AsyncMock, return_value=True),
        patch('app.routes.chat_inquiry.send_visitor_confirmation', new_callable=AsyncMock, return_value=True),
    ):
        response = client.post('/api/v1/chat-inquiry', json={
            'session_id': session_id,
            'name': 'Ravi',
            'business_name': 'Solar Co',
            'email': 'ravi@solar.com',
            'phone': '+91 99999 88888',
        })

    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'accepted'
    assert body['email_sent'] is True
    assert body['confirmation_sent'] is True


def test_chat_inquiry_rejects_missing_fields() -> None:
    response = client.post('/api/v1/chat-inquiry', json={
        'session_id': 'test',
        'name': 'A',
    })
    assert response.status_code == 422


def test_chat_inquiry_rejects_invalid_email() -> None:
    response = client.post('/api/v1/chat-inquiry', json={
        'session_id': 'test',
        'name': 'Valid Name',
        'email': 'not-an-email',
        'phone': '+91 12345 67890',
    })
    assert response.status_code == 422


def test_chat_inquiry_includes_transcript_in_email(monkeypatch) -> None:
    """Verify the transcript is fetched and passed to the email function."""
    memory = set_test_memory(monkeypatch)
    session_id = 'inquiry-transcript'
    memory.add_turn(session_id, 'Question 1', 'Answer 1')
    memory.add_turn(session_id, 'Question 2', 'Answer 2')

    captured_transcript = []

    async def mock_send(inquiry, transcript, settings=None):
        captured_transcript.extend(transcript)
        return True

    with (
        patch('app.routes.chat_inquiry.send_chat_inquiry_notification', side_effect=mock_send),
        patch('app.routes.chat_inquiry.send_visitor_confirmation', new_callable=AsyncMock, return_value=True),
    ):
        response = client.post('/api/v1/chat-inquiry', json={
            'session_id': session_id,
            'name': 'Test User',
            'email': 'test@example.com',
            'phone': '+91 11111 22222',
        })

    assert response.status_code == 200
    assert len(captured_transcript) == 4  # 2 turns = 4 messages
    assert captured_transcript[0]['role'] == 'user'
    assert captured_transcript[0]['content'] == 'Question 1'
