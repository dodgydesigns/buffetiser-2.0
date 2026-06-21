"""Removing investment-key from frontend payload

Revision ID: a04a0a6c853a
Revises: 39d949ab12f0
Create Date: 2026-06-19 16:40:22.533603

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a04a0a6c853a"
down_revision: Union[str, Sequence[str], None] = "39d949ab12f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
