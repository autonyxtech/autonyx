from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_lead_validation_accepts_valid_payload() -> None:
    payload = {
        'name': 'Jane Doe',
        'email': 'jane@example.com',
        'phone': '+91 98765 43210',
        'business_name': 'Test Corp',
        'need': 'Need a new website',
        'consent': True,
    }
    response = client.post('/api/v1/leads', json=payload)
    assert response.status_code == 200
    assert response.json()['status'] == 'accepted'


def test_lead_validation_rejects_invalid_email() -> None:
    payload = {
        'name': 'Jane Doe',
        'email': 'not-an-email',
        'phone': '+91 98765 43210',
        'need': 'Need a new website',
        'consent': True,
    }
    response = client.post('/api/v1/leads', json=payload)
    assert response.status_code == 422


def test_lead_honeypot_silently_accepts() -> None:
    """A filled honeypot field should not error but should not send email."""
    payload = {
        'name': 'Bot',
        'email': 'bot@spam.com',
        'phone': '1234567890',
        'need': 'Buy now',
        'website': 'http://spam.com',
        'consent': True,
    }
    response = client.post('/api/v1/leads', json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'accepted'
    assert body['email_sent'] is False


def test_lead_with_booking_fields() -> None:
    """The expanded booking form fields should be accepted."""
    payload = {
        'name': 'Raj',
        'email': 'raj@company.com',
        'phone': '+91 12345 67890',
        'business_name': 'Solar Corp',
        'business_type': 'energy_solar',
        'interests': ['website', 'ai_agent'],
        'need': 'Website and chatbot for solar company',
        'package': 'AI Growth',
        'preferred_day': 'weekday',
        'time_range': 'morning',
        'timezone': 'Asia/Kolkata',
        'message': 'Looking forward to the call',
        'consent': True,
    }
    response = client.post('/api/v1/leads', json=payload)
    assert response.status_code == 200
    assert response.json()['status'] == 'accepted'
