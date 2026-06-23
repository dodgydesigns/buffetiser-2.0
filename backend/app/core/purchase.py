from __future__ import annotations

from datetime import datetime

from app.business.ledger import recalculate_sales
from app.business.investment import generate_key
from app.core.constants import Exchanges, Platforms
from app.models.investment import Investment
from app.models.purchase import Purchase
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlmodel import SQLModel, select


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


def create_purchase(
    db: Session,
    purchase_in: PurchaseCreate,
    owner_id: int = 1,
) -> Purchase:
    exchange_value = (
        purchase_in.exchange.value
        if isinstance(purchase_in.exchange, Exchanges)
        else purchase_in.exchange
    )

    investment = db.scalar(
        select(Investment).where(
            Investment.owner_id == owner_id,
            Investment.exchange == exchange_value,
            Investment.symbol == purchase_in.symbol.upper(),
        )
    )

    if investment is None:
        base_key = generate_key(
            exchange=exchange_value,
            symbol=purchase_in.symbol.upper(),
        )
        investment_key = base_key
        if db.get(Investment, investment_key) is not None:
            investment_key = generate_key(
                exchange=exchange_value,
                symbol=purchase_in.symbol.upper(),
                owner_id=owner_id,
            )
        investment = Investment(
            owner_id=owner_id,
            symbol=purchase_in.symbol.upper(),
            key=investment_key,
            name=purchase_in.name or purchase_in.symbol,
            exchange=exchange_value,
        )
        db.add(investment)
        db.flush()
    elif not investment.visible:
        investment.visible = True
        db.add(investment)

    purchase_data = purchase_in.model_dump()

    # Purchase table does not have symbol or name
    purchase_data.pop("symbol", None)
    purchase_data.pop("name", None)

    # Use the generated investment key, not frontend value
    purchase_data["investment_key"] = investment.key

    purchase = Purchase(**purchase_data)

    db.add(purchase)

    try:
        db.flush()
        recalculate_sales(db, investment.key)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicatePurchaseError from exc

    db.refresh(purchase)
    return purchase
