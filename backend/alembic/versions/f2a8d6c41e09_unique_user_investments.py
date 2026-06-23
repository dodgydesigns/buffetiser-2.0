"""Ensure each account has one investment per exchange and symbol.

Revision ID: f2a8d6c41e09
Revises: e4b9c71d2a10
Create Date: 2026-06-23
"""

from collections.abc import Sequence

from alembic import op

revision: str = "f2a8d6c41e09"
down_revision: str | Sequence[str] | None = "e4b9c71d2a10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_investment_owner_exchange_symbol",
        "investment",
        ["owner_id", "exchange", "symbol"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_investment_owner_exchange_symbol",
        "investment",
        type_="unique",
    )
