from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.db.models import Lead, WebsiteAnalytics
from app.db.session import get_engine


def save_lead(data: dict[str, Any], source: str) -> None:
    with Session(get_engine()) as session, session.begin():
        session.add(Lead(created_at=datetime.now(timezone.utc), source=source, data=data))


def list_leads() -> list[dict[str, Any]]:
    with Session(get_engine()) as session:
        leads = session.scalars(select(Lead).order_by(Lead.id.desc())).all()
        return [
            {
                'id': lead.id,
                'created_at': (
                    lead.created_at
                    if lead.created_at.tzinfo is not None
                    else lead.created_at.replace(tzinfo=timezone.utc)
                ).isoformat(),
                'source': lead.source,
                **lead.data,
            }
            for lead in leads
        ]


def delete_lead(lead_id: int) -> bool:
    with Session(get_engine()) as session, session.begin():
        lead = session.get(Lead, lead_id)
        if lead is None:
            return False
        session.delete(lead)
        return True


def record_website_visit() -> None:
    engine = get_engine()
    insert = postgresql_insert if engine.dialect.name == 'postgresql' else sqlite_insert
    statement = insert(WebsiteAnalytics).values(id=1, visits=1)
    statement = statement.on_conflict_do_update(
        index_elements=[WebsiteAnalytics.id],
        set_={'visits': WebsiteAnalytics.visits + 1},
    )
    with Session(engine) as session, session.begin():
        session.execute(statement)


def get_website_visit_count() -> int:
    with Session(get_engine()) as session:
        analytics = session.get(WebsiteAnalytics, 1)
        return analytics.visits if analytics is not None else 0
