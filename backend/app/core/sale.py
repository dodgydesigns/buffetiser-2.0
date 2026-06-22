from __future__ import annotations

from datetime import datetime

from app.business.ledger import (
    InsufficientUnitsAtDateError,
    recalculate_sales,
)
from app.core.constants import Exchanges
from app.models.investment import Investment
from app.models.sale import Sale
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel import Field, SQLModel


class SaleCreate(SQLModel):
    investment_key: str
    currency: str = "AUD"
    exchange: Exchanges = Exchanges.XASX
    units: float = Field(gt=0)
    price_per_unit: float = Field(ge=0)
    fee: float = Field(ge=0)
    date: datetime
    trade_count: int = Field(default=1, ge=1)


class SaleRead(SQLModel):
    id: int
    investment_key: str
    currency: str
    exchange: Exchanges
    units: float
    price_per_unit: float
    realised_profit_per_unit: float
    fee: float
    date: datetime
    trade_count: int


class InvestmentNotFoundError(Exception):
    pass


class InsufficientUnitsError(Exception):
    def __init__(self, available_units: float):
        self.available_units = available_units
        super().__init__(f"Only {available_units} units are available")


class DuplicateSaleError(Exception):
    pass


def create_sale(db: Session, sale_in: SaleCreate) -> Sale:
    investment = db.scalar(
        select(Investment).where(Investment.key == sale_in.investment_key)
    )
    if investment is None:
        raise InvestmentNotFoundError

    sale = Sale(
        **sale_in.model_dump(),
        realised_profit_per_unit=0,
    )
    db.add(sale)

    try:
        db.flush()
        recalculate_sales(db, investment.key)
        db.commit()
    except InsufficientUnitsAtDateError as exc:
        db.rollback()
        raise InsufficientUnitsError(exc.available_units) from exc
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateSaleError from exc

    db.refresh(sale)
    return sale
