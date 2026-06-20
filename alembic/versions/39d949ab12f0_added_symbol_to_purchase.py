"""added symbol to purchase

Revision ID: 39d949ab12f0
Revises: 4802fc91aa66
Create Date: 2026-06-18 09:30:38.197810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39d949ab12f0'
down_revision: Union[str, Sequence[str], None] = '4802fc91aa66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
