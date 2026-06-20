"""Migration script

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = ${up_revision!r}
down_revision = ${down_revision!r}
branch_labels = ${branch_labels!r}
depends_on = ${depends_on!r}


def upgrade():
    pass


def downgrade():
    pass
