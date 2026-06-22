from __future__ import annotations

from datetime import datetime

from app.business.investment import average_cost_excluding_fees, total_units
from app.core.constants import Exchanges
from app.models.investment import Investment
from app.models.sale import Sale
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
from typing import Any, cast
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
    realized_profit_per_unit: float
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
        select(Investment)
        .where(Investment.key == sale_in.investment_key)
        .options(
            selectinload(cast(Any, Investment.purchases)),
            selectinload(cast(Any, Investment.sales)),
            selectinload(cast(Any, Investment.dividend_reinvestments)),
        )
    )
    if investment is None:
        raise InvestmentNotFoundError

    available_units = total_units(investment)
    if sale_in.units > available_units:
        raise InsufficientUnitsError(available_units)

    realized_profit_per_unit = (
        sale_in.price_per_unit - average_cost_excluding_fees(investment)
    )
    sale = Sale(
        **sale_in.model_dump(),
        realized_profit_per_unit=realized_profit_per_unit,
    )
    db.add(sale)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateSaleError from exc

    db.refresh(sale)
    return sale
