from __future__ import annotations

from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlmodel import SQLModel, select

from app.core.constants import Exchanges, Platforms
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.business.investment import generate_key


class PurchaseCreate(SQLModel):
    symbol: str
    name: str | None = None
    currency: str = "AUD"
    exchange: Exchanges = Exchanges.XASX
    platform: Platforms = Platforms.CMC
    units: float
    price_per_unit: float
    fee: float
    date: datetime
    trade_count: int


class PurchaseRead(SQLModel):
    id: int
    investment_key: str
    currency: str
    exchange: Exchanges
    platform: Platforms
    units: float
    price_per_unit: float
    fee: float
    date: datetime
    trade_count: int


class InvestmentNotFoundError(Exception):
    pass


class DuplicatePurchaseError(Exception):
    pass


def create_purchase(db: Session, purchase_in: PurchaseCreate) -> Purchase:
    exchange_value = (
        purchase_in.exchange.value
        if isinstance(purchase_in.exchange, Exchanges)
        else purchase_in.exchange
    )

    investment_key = generate_key(
        exchange=exchange_value,
        symbol=purchase_in.symbol,
    )

    investment = db.scalar(
        select(Investment).where(Investment.key == investment_key)
    )

    if investment is None:
        investment = Investment(
            symbol=purchase_in.symbol,
            key=investment_key,
            name=purchase_in.name or purchase_in.symbol,
        )
        db.add(investment)
        db.commit()
        db.refresh(investment)

    purchase_data = purchase_in.model_dump()

    # Purchase table does not have symbol or name
    purchase_data.pop("symbol", None)
    purchase_data.pop("name", None)

    # Use the generated investment key, not frontend value
    purchase_data["investment_key"] = investment.key

    purchase = Purchase(**purchase_data)

    db.add(purchase)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicatePurchaseError from exc

    db.refresh(purchase)
    return purchase
