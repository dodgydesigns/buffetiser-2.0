from typing import TYPE_CHECKING, List, Optional

from app.core.constants import InvestmentType
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.dividend import DividendPayment, DividendReinvestment
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
    dividend_payments: List["DividendPayment"] = Relationship(
        back_populates="investment"
    )
    dividend_reinvestments: List["DividendReinvestment"] = Relationship(
        back_populates="investment"
    )
