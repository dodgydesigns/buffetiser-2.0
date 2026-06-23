from datetime import datetime

from app.business.ledger import recalculate_sales
from app.models.dividend import DividendPayment, DividendReinvestment
from app.models.investment import Investment
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlmodel import Field, SQLModel, col, select


class InvestmentNotFoundError(Exception):
    pass


class AmbiguousInvestmentError(Exception):
    pass


class DuplicateReturnError(Exception):
    pass


class DividendPaymentCreate(SQLModel):
    symbol: str
    date: datetime
    value: float = Field(gt=0)


class DividendPaymentRead(SQLModel):
    id: int
    investment_key: str
    date: datetime
    value: float


class DividendReinvestmentCreate(SQLModel):
    symbol: str
    date: datetime
    units: float = Field(gt=0)
    price_per_unit: float = Field(ge=0)


class DividendReinvestmentRead(SQLModel):
    id: int
    investment_key: str
    date: datetime
    units: float
    price_per_unit: float


def _investment_for_symbol(
    db: Session,
    symbol: str,
    owner_id: int,
) -> Investment:
    investments = db.scalars(
        select(Investment).where(
            col(Investment.symbol) == symbol.upper(),
            col(Investment.owner_id) == owner_id,
            col(Investment.visible).is_(True),
        )
    ).all()
    if not investments:
        raise InvestmentNotFoundError
    if len(investments) > 1:
        raise AmbiguousInvestmentError
    return investments[0]


def create_dividend_payment(
    db: Session,
    payment_in: DividendPaymentCreate,
    owner_id: int = 1,
) -> DividendPayment:
    investment = _investment_for_symbol(db, payment_in.symbol, owner_id)
    payment = DividendPayment(
        investment_key=investment.key,
        date=payment_in.date,
        value=payment_in.value,
    )
    db.add(payment)
    _commit_return(db, payment)
    return payment


def create_dividend_reinvestment(
    db: Session,
    reinvestment_in: DividendReinvestmentCreate,
    owner_id: int = 1,
) -> DividendReinvestment:
    investment = _investment_for_symbol(db, reinvestment_in.symbol, owner_id)
    reinvestment = DividendReinvestment(
        investment_key=investment.key,
        date=reinvestment_in.date,
        units=reinvestment_in.units,
        price_per_unit=reinvestment_in.price_per_unit,
    )
    db.add(reinvestment)
    try:
        db.flush()
        recalculate_sales(db, investment.key)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateReturnError from exc
    db.refresh(reinvestment)
    return reinvestment


def _commit_return(db: Session, record) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateReturnError from exc
    db.refresh(record)
