from datetime import UTC, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.investment import Investment
    from app.models.user_session import UserSession


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=64)
    display_name: str = Field(max_length=128)
    password_hash: str = Field(max_length=255)
    is_admin: bool = False
    is_bootstrap: bool = False
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None)
    )

    investments: List["Investment"] = Relationship(back_populates="owner")
    sessions: List["UserSession"] = Relationship(back_populates="user")

    __table_args__ = (UniqueConstraint("username"),)
