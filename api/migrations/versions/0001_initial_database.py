"""Create leads and website analytics tables.

Revision ID: 0001_initial
Revises:
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.String(length=32), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_leads_created_at', 'leads', ['created_at'], unique=False)
    op.create_table(
        'website_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visits', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.CheckConstraint('id = 1', name='ck_website_analytics_singleton'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('website_analytics')
    op.drop_index('ix_leads_created_at', table_name='leads')
    op.drop_table('leads')
