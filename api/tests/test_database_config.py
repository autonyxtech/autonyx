import json
import sqlite3
from types import SimpleNamespace

from app.services import lead_store
from app.db.session import get_database_url


def test_postgres_urls_use_psycopg_driver() -> None:
    settings = SimpleNamespace(
        database_url='postgresql://user:password@database.example/autonyx?sslmode=require',
        leads_database_path='data/autonyx.db',
    )

    url = get_database_url(settings)

    assert url.startswith('postgresql+psycopg://')
    assert url.endswith('?sslmode=require')


def test_legacy_postgres_url_uses_psycopg_driver() -> None:
    settings = SimpleNamespace(
        database_url='postgres://user:password@database.example/autonyx',
        leads_database_path='data/autonyx.db',
    )

    assert get_database_url(settings).startswith('postgresql+psycopg://')


def test_empty_database_url_uses_sqlite_fallback(tmp_path) -> None:
    settings = SimpleNamespace(
        database_url='',
        leads_database_path=str(tmp_path / 'local.db'),
    )

    url = get_database_url(settings)

    assert url.startswith('sqlite:///')
    assert url.endswith('local.db')


def test_lead_store_reads_existing_sqlite_schema(monkeypatch, tmp_path) -> None:
    database_path = tmp_path / 'legacy.db'
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            'CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, source TEXT NOT NULL, data TEXT NOT NULL)'
        )
        connection.execute(
            'CREATE TABLE website_analytics (id INTEGER PRIMARY KEY CHECK (id = 1), visits INTEGER NOT NULL DEFAULT 0)'
        )
        connection.execute(
            'INSERT INTO leads (created_at, source, data) VALUES (?, ?, ?)',
            (
                '2026-01-02T03:04:05+00:00',
                'booking',
                json.dumps({'name': 'Legacy customer', 'email': 'legacy@example.com'}),
            ),
        )
    monkeypatch.setattr(
        'app.db.session.get_settings',
        lambda: SimpleNamespace(database_url='', leads_database_path=str(database_path)),
    )

    leads = lead_store.list_leads()

    assert len(leads) == 1
    assert leads[0]['name'] == 'Legacy customer'
    assert leads[0]['created_at'] == '2026-01-02T03:04:05+00:00'
