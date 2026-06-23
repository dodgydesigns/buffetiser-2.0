"""Add users, sessions and portfolio ownership.

Revision ID: e4b9c71d2a10
Revises: c8e4f2a91b77
Create Date: 2026-06-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "e4b9c71d2a10"
down_revision: str | Sequence[str] | None = "c8e4f2a91b77"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "username",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column(
            "display_name",
            sqlmodel.sql.sqltypes.AutoString(length=128),
            nullable=False,
        ),
        sa.Column(
            "password_hash",
            sqlmodel.sql.sqltypes.AutoString(length=255),
            nullable=False,
        ),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("is_bootstrap", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_user_username"), "user", ["username"], unique=True)

    connection = op.get_bind()
    bootstrap_id = connection.execute(
        sa.text(
            """
            INSERT INTO "user"
                (username, display_name, password_hash, is_admin, is_bootstrap, created_at)
            VALUES
                ('__bootstrap__', 'Initial administrator', '!', true, true, CURRENT_TIMESTAMP)
            RETURNING id
            """
        )
    ).scalar_one()

    op.add_column(
        "investment",
        sa.Column("owner_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "investment",
        sa.Column(
            "exchange",
            sqlmodel.sql.sqltypes.AutoString(length=16),
            nullable=True,
        ),
    )
    connection.execute(
        sa.text(
            """
            UPDATE investment
            SET owner_id = :owner_id,
                exchange = split_part(key, '-', 1)
            """
        ),
        {"owner_id": bootstrap_id},
    )
    op.alter_column("investment", "owner_id", nullable=False)
    op.alter_column(
        "investment",
        "exchange",
        existing_type=sqlmodel.sql.sqltypes.AutoString(length=16),
        nullable=False,
        server_default="XASX",
    )
    op.alter_column(
        "investment",
        "key",
        existing_type=sqlmodel.sql.sqltypes.AutoString(length=32),
        type_=sqlmodel.sql.sqltypes.AutoString(length=64),
        existing_nullable=False,
    )
    op.create_foreign_key(
        "fk_investment_owner_id_user",
        "investment",
        "user",
        ["owner_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_investment_owner_id"),
        "investment",
        ["owner_id"],
        unique=False,
    )

    op.create_table(
        "usersession",
        sa.Column(
            "token_hash",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(
        op.f("ix_usersession_user_id"),
        "usersession",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_usersession_expires_at"),
        "usersession",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("usersession")
    op.drop_index(op.f("ix_investment_owner_id"), table_name="investment")
    op.drop_constraint(
        "fk_investment_owner_id_user",
        "investment",
        type_="foreignkey",
    )
    op.drop_column("investment", "exchange")
    op.drop_column("investment", "owner_id")
    op.alter_column(
        "investment",
        "key",
        existing_type=sqlmodel.sql.sqltypes.AutoString(length=64),
        type_=sqlmodel.sql.sqltypes.AutoString(length=32),
        existing_nullable=False,
    )
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.drop_table("user")
