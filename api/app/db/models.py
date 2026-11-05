from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, JSON, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Lead(Base):
    __tablename__ = 'leads'
    __table_args__ = (Index('ix_leads_created_at', 'created_at'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class WebsiteAnalytics(Base):
    __tablename__ = 'website_analytics'
    __table_args__ = (CheckConstraint('id = 1', name='ck_website_analytics_singleton'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visits: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
