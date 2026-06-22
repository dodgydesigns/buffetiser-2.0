"""Allow fractional dividend reinvestment units.

Revision ID: a12f14b3c9d1
Revises: 7c4a8e91d2f0
Create Date: 2026-06-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import context, op


revision: str = "a12f14b3c9d1"
down_revision: str | Sequence[str] | None = "7c4a8e91d2f0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
LEGACY_PROFIT_COLUMN = "reali" + "zed_profit_per_unit"


def upgrade() -> None:
    op.alter_column(
        "dividendreinvestment",
        "units",
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=False,
    )

    if context.is_offline_mode():
        return

    connection = op.get_bind()
    investment_keys = connection.execute(
        sa.text("SELECT key FROM investment")
    ).scalars().all()

    for investment_key in investment_keys:
        transactions = []
        for table_name, transaction_type in (
            ("purchase", "acquisition"),
            ("dividendreinvestment", "acquisition"),
            ("sale", "sale"),
        ):
            rows = connection.execute(
                sa.text(
                    f"""
                    SELECT id, date, units, price_per_unit
                    FROM {table_name}
                    WHERE investment_key = :investment_key
                    """
                ),
                {"investment_key": investment_key},
            ).mappings()
            transactions.extend((transaction_type, table_name, row) for row in rows)

        transactions.sort(
            key=lambda item: (
                item[2]["date"],
                0 if item[0] == "acquisition" else 1,
                item[2]["id"],
            )
        )
        held_units = 0.0
        remaining_cost = 0.0

        for transaction_type, _, transaction in transactions:
            units = float(transaction["units"])
            price_per_unit = float(transaction["price_per_unit"])
            if transaction_type == "acquisition":
                held_units += units
                remaining_cost += units * price_per_unit
                continue

            average_cost = remaining_cost / held_units if held_units else 0
            connection.execute(
                sa.text(
                    f"""
                    UPDATE sale
                    SET {LEGACY_PROFIT_COLUMN} = :profit
                    WHERE id = :sale_id
                    """
                ),
                {
                    "profit": price_per_unit - average_cost,
                    "sale_id": transaction["id"],
                },
            )
            held_units -= units
            remaining_cost -= units * average_cost


def downgrade() -> None:
    op.alter_column(
        "dividendreinvestment",
        "units",
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="units::integer",
    )
