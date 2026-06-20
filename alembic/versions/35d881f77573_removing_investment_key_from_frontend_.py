"""Removing investment-key from frontend payload v2

Revision ID: 35d881f77573
Revises: a04a0a6c853a
Create Date: 2026-06-19 17:34:52.318891

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35d881f77573'
down_revision: Union[str, Sequence[str], None] = 'a04a0a6c853a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
