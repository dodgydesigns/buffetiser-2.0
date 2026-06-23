from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.user import User


class UserSession(SQLModel, table=True):
    token_hash: str = Field(primary_key=True, max_length=64)
    user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None)
    )
    expires_at: datetime = Field(index=True)

    user: Optional["User"] = Relationship(back_populates="sessions")
