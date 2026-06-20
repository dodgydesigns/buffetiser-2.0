"""added symbol to purchase

Revision ID: 4802fc91aa66
Revises: 44f88388a225
Create Date: 2026-06-17 10:18:15.454318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4802fc91aa66'
down_revision: Union[str, Sequence[str], None] = '44f88388a225'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
