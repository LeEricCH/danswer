"""add alternate assistant to chat message

Revision ID: 3a7802814195
Revises: b85f02ec1308
Create Date: 2024-06-05 11:18:49.966333

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3a7802814195"
down_revision = "b85f02ec1308"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "chat_message", sa.Column("alternate_assistant_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        "fk_chat_message_persona",
        "chat_message",
        "persona",
        ["alternate_assistant_id"],
        ["id"],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint("fk_chat_message_persona", "chat_message", type_="foreignkey")
    op.drop_column("chat_message", "alternate_assistant_id")
