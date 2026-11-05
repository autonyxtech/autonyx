from collections.abc import AsyncIterator
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.agents.memory import store as memory_module
from app.agents.memory.store import ChatMemoryStore
from app.core import rate_limit
from app.main import app

client = TestClient(app)


def set_test_memory(monkeypatch) -> ChatMemoryStore:
    memory = ChatMemoryStore(ttl_seconds=3600, max_messages=20)
    monkeypatch.setattr(memory_module, '_memory_store', memory)
    return memory


def test_chat_streams_graph_reply_and_saves_memory(monkeypatch) -> None:
    memory = set_test_memory(monkeypatch)

    async def reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        yield 'Hello '
        yield 'from the agent'

    with patch('app.agents.graph.llm_service.stream_reply', reply_stream):
        response = client.post('/api/v1/chat', json={'session_id': 'session-123', 'message': 'Need a website'})

    assert response.status_code == 200
    assert 'text/event-stream' in response.headers['content-type']
    assert '"text": "Hello "' in response.text
    assert '"text": "from the agent"' in response.text
    assert '"type": "done"' in response.text
    assert memory.get_history('session-123') == [
        {'role': 'user', 'content': 'Need a website'},
        {'role': 'assistant', 'content': 'Hello from the agent'},
    ]


def test_chat_rejects_blank_message() -> None:
    response = client.post('/api/v1/chat', json={'session_id': 'session-blank', 'message': '   '})
    assert response.status_code == 422


def test_chat_streams_generation_failure_without_saving_turn(monkeypatch) -> None:
    memory = set_test_memory(monkeypatch)

    async def failing_reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        raise RuntimeError('provider unavailable')
        yield ''

    with patch('app.agents.graph.llm_service.stream_reply', failing_reply_stream):
        response = client.post('/api/v1/chat', json={'session_id': 'session-failure', 'message': 'Need a website'})

    assert response.status_code == 200
    assert '"type": "error"' in response.text
    assert 'temporarily unavailable' in response.text
    assert memory.get_history('session-failure') == []


def test_chat_includes_recent_memory_and_keeps_history_bounded(monkeypatch) -> None:
    memory = set_test_memory(monkeypatch)
    session_id = 'session-history'
    memory.add_turn(session_id, 'earlier question', 'earlier answer')
    received_messages: list[dict[str, str]] = []

    async def capture_stream(messages: list[dict[str, str]]) -> AsyncIterator[str]:
        received_messages.extend(messages)
        yield 'A concise reply'

    with patch('app.agents.graph.llm_service.stream_reply', capture_stream):
        response = client.post('/api/v1/chat', json={'session_id': session_id, 'message': '  Follow up  '})

    assert response.status_code == 200
    assert received_messages[1] == {'role': 'user', 'content': 'earlier question'}
    assert received_messages[2] == {'role': 'assistant', 'content': 'earlier answer'}
    assert received_messages[-1]['content'] == 'Follow up'
    assert len(memory.get_history(session_id)) == 4


def test_chat_does_not_save_incomplete_empty_response(monkeypatch) -> None:
    memory = set_test_memory(monkeypatch)

    async def empty_reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if False:
            yield ''

    with patch('app.agents.graph.llm_service.stream_reply', empty_reply_stream):
        response = client.post('/api/v1/chat', json={'session_id': 'session-empty', 'message': 'Hello'})

    assert response.status_code == 200
    assert '"type": "error"' in response.text
    assert memory.get_history('session-empty') == []


def test_daily_chat_cap_returns_429(monkeypatch) -> None:
    monkeypatch.setattr(rate_limit, 'get_settings', lambda: SimpleNamespace(daily_usage_cap=0))

    response = client.post('/api/v1/chat', json={'session_id': 'session-cap', 'message': 'Need a website'})

    assert response.status_code == 429
    assert 'daily request limit' in response.json()['detail']


def test_show_lead_form_emitted_after_threshold(monkeypatch) -> None:
    """After the configured message threshold, a show_lead_form event should be emitted."""
    memory = set_test_memory(monkeypatch)
    session_id = 'session-lead-form'
    # Pre-fill 2 user turns so the next message is the 3rd
    memory.add_turn(session_id, 'question 1', 'answer 1')
    memory.add_turn(session_id, 'question 2', 'answer 2')

    async def reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        yield 'Here is info'

    with patch('app.agents.graph.llm_service.stream_reply', reply_stream):
        response = client.post('/api/v1/chat', json={'session_id': session_id, 'message': 'Third question'})

    assert response.status_code == 200
    assert '"show_lead_form"' in response.text


def test_contact_intent_shows_in_chat_inquiry_form_immediately(monkeypatch) -> None:
    set_test_memory(monkeypatch)

    async def reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        yield 'I can help you get started.'

    with patch('app.agents.graph.llm_service.stream_reply', reply_stream):
        response = client.post(
            '/api/v1/chat',
            json={'session_id': 'session-contact-intent', 'message': 'any form here?'},
        )

    assert response.status_code == 200
    assert '"show_lead_form"' in response.text
    assert 'quick inquiry form below' in response.text


def test_integration_interest_shows_in_chat_inquiry_form(monkeypatch) -> None:
    set_test_memory(monkeypatch)

    async def reply_stream(_messages: list[dict[str, str]]) -> AsyncIterator[str]:
        yield 'We can help with that.'

    with patch('app.agents.graph.llm_service.stream_reply', reply_stream):
        response = client.post(
            '/api/v1/chat',
            json={
                'session_id': 'session-integration-interest',
                'message': 'I want to integrate an AI agent into our website',
            },
        )

    assert response.status_code == 200
    assert '"show_lead_form"' in response.text
