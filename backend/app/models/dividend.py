from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

if TYPE_CHECKING:
    from app.models.investment import Investment


class DividendReinvestment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    investment_key: str = Field(foreign_key="investment.key")
    investment: Optional["Investment"] = Relationship()

    date: datetime
    units: int = 0
    price_per_unit: float

    __table_args__ = (UniqueConstraint("date", "investment_key"),)


class DividendPayment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    investment_key: str = Field(foreign_key="investment.key")
    investment: Optional["Investment"] = Relationship()

    date: datetime
    value: float

    __table_args__ = (UniqueConstraint("date", "investment_key"),)
