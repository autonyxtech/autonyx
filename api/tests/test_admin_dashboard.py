from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.agents.memory import store as memory_module
from app.agents.memory.store import ChatMemoryStore
from app.db.base import Base
from app.db.session import get_engine
from app.main import app
from app.services import lead_store

client = TestClient(app)
ADMIN_PASSWORD = 'a-long-test-dashboard-password'


def use_test_database(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(
        'app.db.session.get_settings',
        lambda: SimpleNamespace(
            database_url='',
            leads_database_path=str(tmp_path / 'dashboard.db'),
        ),
    )
    Base.metadata.create_all(get_engine())
    monkeypatch.setattr(
        'app.routes.admin.get_settings',
        lambda: SimpleNamespace(admin_password=ADMIN_PASSWORD),
    )


def test_admin_requires_password_before_returning_leads(monkeypatch, tmp_path) -> None:
    use_test_database(monkeypatch, tmp_path)

    response = client.get('/api/v1/admin/leads')

    assert response.status_code == 401


def test_dashboard_collects_booking_chat_and_website_visits(monkeypatch, tmp_path) -> None:
    use_test_database(monkeypatch, tmp_path)
    memory = ChatMemoryStore(ttl_seconds=3600, max_messages=20)
    monkeypatch.setattr(memory_module, '_memory_store', memory)

    with patch('app.routes.leads.send_lead_notification', new_callable=AsyncMock, return_value=False), patch(
        'app.routes.leads.send_visitor_confirmation', new_callable=AsyncMock, return_value=False
    ):
        booking_response = client.post('/api/v1/leads', json={
            'name': 'Jane Doe',
            'email': 'jane@example.com',
            'phone': '+91 98765 43210',
            'business_name': 'Solar Co',
            'need': 'Need a new website',
            'consent': True,
        })
    assert booking_response.status_code == 200

    memory.add_turn('dashboard-chat', 'Need more information', 'Certainly.')
    with patch(
        'app.routes.chat_inquiry.send_chat_inquiry_notification',
        new_callable=AsyncMock,
        return_value=False,
    ), patch(
        'app.routes.chat_inquiry.send_visitor_confirmation',
        new_callable=AsyncMock,
        return_value=False,
    ):
        chat_response = client.post('/api/v1/chat-inquiry', json={
            'session_id': 'dashboard-chat',
            'name': 'Ravi Singh',
            'business_name': 'Ravi Foods',
            'email': 'ravi@example.com',
            'phone': '+91 99999 88888',
        })
    assert chat_response.status_code == 200
    client.post('/api/v1/analytics/visit')
    client.post('/api/v1/analytics/visit')

    login_response = client.post('/api/v1/admin/login', json={'password': ADMIN_PASSWORD})
    assert login_response.status_code == 200
    headers = {'Authorization': f"Bearer {login_response.json()['token']}"}

    leads_response = client.get('/api/v1/admin/leads', headers=headers)
    analytics_response = client.get('/api/v1/admin/analytics', headers=headers)
    assert leads_response.headers['cache-control'] == 'no-store'
    assert analytics_response.headers['cache-control'] == 'no-store'
    assert [lead['source'] for lead in leads_response.json()['leads']] == ['chat', 'booking']
    assert leads_response.json()['leads'][0]['email'] == 'ravi@example.com'
    assert analytics_response.json()['website_visits'] == 2


def test_admin_login_rejects_wrong_password(monkeypatch) -> None:
    monkeypatch.setattr(
        'app.routes.admin.get_settings',
        lambda: SimpleNamespace(admin_password=ADMIN_PASSWORD),
    )

    response = client.post('/api/v1/admin/login', json={'password': 'incorrect'})

    assert response.status_code == 401


def test_admin_can_delete_inquiry_and_missing_inquiry_returns_404(monkeypatch, tmp_path) -> None:
    use_test_database(monkeypatch, tmp_path)
    lead_store.save_lead(
        {'name': 'Jane Doe', 'email': 'jane@example.com', 'phone': '+91 98765 43210'},
        'booking',
    )
    login_response = client.post('/api/v1/admin/login', json={'password': ADMIN_PASSWORD})
    headers = {'Authorization': f"Bearer {login_response.json()['token']}"}

    delete_response = client.delete('/api/v1/admin/leads/1', headers=headers)
    missing_response = client.delete('/api/v1/admin/leads/1', headers=headers)
    remaining_leads = client.get('/api/v1/admin/leads', headers=headers)

    assert delete_response.status_code == 204
    assert delete_response.headers['cache-control'] == 'no-store'
    assert missing_response.status_code == 404
    assert remaining_leads.json()['leads'] == []


def test_admin_delete_requires_authentication(monkeypatch, tmp_path) -> None:
    use_test_database(monkeypatch, tmp_path)

    response = client.delete('/api/v1/admin/leads/1')

    assert response.status_code == 401
