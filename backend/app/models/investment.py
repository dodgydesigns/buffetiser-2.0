from typing import TYPE_CHECKING, List, Optional

from app.core.constants import InvestmentType
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.dividend import DividendPayment, DividendReinvestment
    from app.models.history import History
    from app.models.purchase import Purchase
    from app.models.sale import Sale
    from app.models.user import User


class Investment(SQLModel, table=True):
    key: str = Field(primary_key=True, max_length=64)
    owner_id: int = Field(default=1, foreign_key="user.id", index=True)
    name: Optional[str] = Field(default=None, max_length=128)
    symbol: Optional[str] = Field(default=None, max_length=32)
    exchange: str = Field(default="XASX", max_length=16)

    type: InvestmentType = Field(default=InvestmentType.SHARES)

    live_price: float = 0
    visible: bool = True

    # Relationships
    owner: Optional["User"] = Relationship(back_populates="investments")
    purchases: List["Purchase"] = Relationship(back_populates="investment")
    sales: List["Sale"] = Relationship(back_populates="investment")
    history: List["History"] = Relationship(back_populates="investment")
    dividend_payments: List["DividendPayment"] = Relationship(
        back_populates="investment"
    )
    dividend_reinvestments: List["DividendReinvestment"] = Relationship(
        back_populates="investment"
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "exchange",
            "symbol",
            name="uq_investment_owner_exchange_symbol",
        ),
    )
