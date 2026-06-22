from datetime import datetime
from typing import TYPE_CHECKING, Optional

from app.core.constants import Exchanges
from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

if TYPE_CHECKING:
    from app.models.investment import Investment


class Sale(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    investment_key: str = Field(foreign_key="investment.key")
    investment: Optional["Investment"] = Relationship(back_populates="sales")

    currency: str = "AUD"
    exchange: Exchanges = Exchanges.XASX

    units: float
    price_per_unit: float
    realised_profit_per_unit: float = 0
    fee: float
    date: datetime
    trade_count: int

    __table_args__ = (UniqueConstraint("date", "trade_count", "investment_key"),)
