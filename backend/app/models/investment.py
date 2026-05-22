from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from sqlmodel import Field, Relationship, SQLModel

from app.core.constants import InvestmentType

if TYPE_CHECKING:
    from app.models.history import History
    from app.models.purchase import Purchase
    from app.models.sale import Sale


class Investment(SQLModel, table=True):
    key: str = Field(primary_key=True, max_length=32)
    name: Optional[str] = Field(default=None, max_length=128)
    symbol: Optional[str] = Field(default=None, max_length=32)

    type: InvestmentType = Field(default=InvestmentType.SHARES)

    live_price: float = 0
    visible: bool = True

    # Relationships
    purchases: List["Purchase"] = Relationship(back_populates="investment")
    sales: List["Sale"] = Relationship(back_populates="investment")
    history: List["History"] = Relationship(back_populates="investment")

    # -----------------------------
    # BUSINESS LOGIC
    # -----------------------------
    def generate_key(self, exchange: str, symbol: str) -> str:
        return f"{exchange}-{symbol}"

    @property
    def total_units(self) -> float:
        total = sum(p.units for p in self.purchases) - sum(s.units for s in self.sales)
        return int(total) if self.type == InvestmentType.SHARES else total

    @property
    def total_fees(self) -> float:
        return sum(p.fee for p in self.purchases) + sum(s.fee for s in self.sales)

    @property
    def total_cost_excluding_fees(self) -> float:
        cost = sum(p.price_per_unit * p.units for p in self.purchases)
        cost -= sum(s.price_per_unit * s.units for s in self.sales)
        return cost + self.total_fees

    @property
    def average_cost_excluding_fees(self) -> float:
        return self.total_cost_excluding_fees / self.total_units

    @property
    def total_value(self) -> float:
        return self.total_units * self.live_price

    @property
    def total_profit(self) -> float:
        return self.total_value - self.total_cost_excluding_fees - self.total_fees
