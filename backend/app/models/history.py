from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.investment import Investment

class History(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    investment_key: str = Field(foreign_key="investment.key")
    investment: Optional["Investment"] = Relationship(back_populates="history")

    date: datetime
    high: float = 0
    low: float = 0
    close: float = 0
    volume: int = 0

    __table_args__ = (
        UniqueConstraint("date", "investment_key"),
    )
