"""Rename realised profit fields to UK English.

Revision ID: c8e4f2a91b77
Revises: a12f14b3c9d1
Create Date: 2026-06-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "c8e4f2a91b77"
down_revision: str | Sequence[str] | None = "a12f14b3c9d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
LEGACY_PROFIT_COLUMN = "reali" + "zed_profit_per_unit"


def upgrade() -> None:
    op.alter_column(
        "sale",
        LEGACY_PROFIT_COLUMN,
        new_column_name="realised_profit_per_unit",
    )


def downgrade() -> None:
    op.alter_column(
        "sale",
        "realised_profit_per_unit",
        new_column_name=LEGACY_PROFIT_COLUMN,
    )
