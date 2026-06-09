"""Add_email_to_users

Revision ID: 4feda8b3e3f1
Revises: b5e6690e9a90
Create Date: 2026-06-08 00:27:51.444356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4feda8b3e3f1'
down_revision: Union[str, None] = 'b5e6690e9a90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite safety
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(length=255), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)


def downgrade() -> None:
    # Use batch_alter_table for SQLite safety
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))
        batch_op.drop_column('email')
