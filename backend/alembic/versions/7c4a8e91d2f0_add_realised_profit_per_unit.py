"""Add realised profit per unit to sales.

Revision ID: 7c4a8e91d2f0
Revises: 44f88388a225
Create Date: 2026-06-21
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import context, op


revision: str = "7c4a8e91d2f0"
down_revision: str | Sequence[str] | None = "44f88388a225"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
LEGACY_PROFIT_COLUMN = "reali" + "zed_profit_per_unit"


def upgrade() -> None:
    op.add_column(
        "sale",
        sa.Column(LEGACY_PROFIT_COLUMN, sa.Float(), nullable=True),
    )

    if context.is_offline_mode():
        op.execute(
            f"UPDATE sale SET {LEGACY_PROFIT_COLUMN} = 0 "
            f"WHERE {LEGACY_PROFIT_COLUMN} IS NULL"
        )
        op.alter_column(
            "sale",
            LEGACY_PROFIT_COLUMN,
            existing_type=sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        )
        return

    connection = op.get_bind()
    investment_keys = connection.execute(
        sa.text("SELECT key FROM investment")
    ).scalars().all()

    for investment_key in investment_keys:
        purchases = connection.execute(
            sa.text(
                """
                SELECT id, date, trade_count, units, price_per_unit
                FROM purchase
                WHERE investment_key = :investment_key
                """
            ),
            {"investment_key": investment_key},
        ).mappings()
        sales = connection.execute(
            sa.text(
                """
                SELECT id, date, trade_count, units, price_per_unit
                FROM sale
                WHERE investment_key = :investment_key
                """
            ),
            {"investment_key": investment_key},
        ).mappings()

        transactions = [
            ("purchase", row) for row in purchases
        ] + [
            ("sale", row) for row in sales
        ]
        transactions.sort(
            key=lambda item: (
                item[1]["date"],
                item[1]["trade_count"],
                0 if item[0] == "purchase" else 1,
                item[1]["id"],
            )
        )

        held_units = 0.0
        remaining_cost = 0.0

        for transaction_type, transaction in transactions:
            units = float(transaction["units"])
            price_per_unit = float(transaction["price_per_unit"])

            if transaction_type == "purchase":
                held_units += units
                remaining_cost += units * price_per_unit
                continue

            average_buy_price = remaining_cost / held_units if held_units else 0
            realised_profit_per_unit = price_per_unit - average_buy_price
            connection.execute(
                sa.text(
                    f"""
                    UPDATE sale
                    SET {LEGACY_PROFIT_COLUMN} = :realised_profit_per_unit
                    WHERE id = :sale_id
                    """
                ),
                {
                    "realised_profit_per_unit": realised_profit_per_unit,
                    "sale_id": transaction["id"],
                },
            )
            held_units -= units
            remaining_cost -= units * average_buy_price

    op.alter_column(
        "sale",
        LEGACY_PROFIT_COLUMN,
        existing_type=sa.Float(),
        nullable=False,
        server_default=sa.text("0"),
    )


def downgrade() -> None:
    op.drop_column("sale", LEGACY_PROFIT_COLUMN)
