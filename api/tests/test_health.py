from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'ok'
    assert body['chat_configured'] is bool(get_settings().llm_api_key.strip())
    assert body['llm_provider'] == get_settings().llm_provider
