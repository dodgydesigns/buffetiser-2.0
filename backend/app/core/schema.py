from __future__ import annotations

import logging
from datetime import UTC, datetime

import app.models  # noqa: F401
from app.db.session import engine
from app.models.user import User
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from sqlmodel import SQLModel, select

_logger = logging.getLogger(__name__)

REQUIRED_TABLES = {
    "configuration",
    "dailychange",
    "dividendpayment",
    "dividendreinvestment",
    "history",
    "investment",
    "purchase",
    "sale",
    "user",
    "usersession",
}


def ensure_database_schema() -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    missing_tables = REQUIRED_TABLES - existing_tables
    if not missing_tables:
        ensure_bootstrap_user()
        return

    _logger.warning(
        "Database schema is missing table(s): %s. Creating missing tables.",
        ", ".join(sorted(missing_tables)),
    )
    ensure_investment_key_referenceable(inspector, existing_tables)
    SQLModel.metadata.create_all(engine)
    ensure_bootstrap_user()


def ensure_investment_key_referenceable(
    inspector,
    existing_tables: set[str],
) -> None:
    if "investment" not in existing_tables:
        return

    primary_key = inspector.get_pk_constraint("investment")
    primary_key_columns = set(primary_key.get("constrained_columns") or [])
    if "key" in primary_key_columns:
        return

    unique_constraints = inspector.get_unique_constraints("investment")
    has_unique_key = any(
        constraint.get("column_names") == ["key"]
        for constraint in unique_constraints
    )
    if has_unique_key:
        return

    with engine.begin() as connection:
        duplicate_keys = connection.execute(
            text(
                """
                SELECT key
                FROM investment
                GROUP BY key
                HAVING COUNT(*) > 1
                LIMIT 5
                """
            )
        ).scalars().all()
        if duplicate_keys:
            raise RuntimeError(
                "Cannot repair the Buffetiser schema because investment.key "
                "contains duplicate value(s): "
                f"{', '.join(str(key) for key in duplicate_keys)}"
            )

        _logger.warning(
            "Database schema is missing a unique constraint on investment.key. "
            "Adding repair constraint."
        )
        connection.execute(
            text(
                """
                ALTER TABLE investment
                ADD CONSTRAINT uq_investment_key_repair UNIQUE (key)
                """
            )
        )


def ensure_bootstrap_user() -> None:
    with Session(engine) as session:
        existing_user = session.scalar(select(User))
        if existing_user is not None:
            return

        _logger.warning(
            "No Buffetiser users exist. Creating initial administrator setup user."
        )
        session.add(
            User(
                username="__bootstrap__",
                display_name="Initial administrator",
                password_hash="!",
                is_admin=True,
                is_bootstrap=True,
                created_at=datetime.now(UTC).replace(tzinfo=None),
            )
        )
        session.commit()
