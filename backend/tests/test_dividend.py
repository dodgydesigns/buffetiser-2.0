from datetime import datetime

import pytest
from app.business.investment import average_cost, total_cost, total_profit, total_units
from app.core.dividend import (
    DividendPaymentCreate,
    DividendReinvestmentCreate,
    DuplicateReturnError,
    InvestmentNotFoundError,
    create_dividend_payment,
    create_dividend_reinvestment,
)
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine


@pytest.fixture
def dividend_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(
            Investment(
                key="XASX-ABC",
                name="ABC Limited",
                symbol="ABC",
                live_price=10,
            )
        )
        session.add(
            Purchase(
                investment_key="XASX-ABC",
                units=10,
                price_per_unit=5,
                fee=1,
                date=datetime(2026, 1, 1),
                trade_count=1,
            )
        )
        session.commit()
        yield session


def test_reinvestment_adds_units_and_weighted_cost(dividend_session):
    create_dividend_reinvestment(
        dividend_session,
        DividendReinvestmentCreate(
            symbol="ABC",
            date=datetime(2026, 2, 1),
            units=2.5,
            price_per_unit=8,
        ),
    )

    investment = dividend_session.get(Investment, "XASX-ABC")
    assert investment is not None
    assert total_units(investment) == 12.5
    assert total_cost(investment) == 70
    assert average_cost(investment) == pytest.approx(5.6)
    assert total_profit(investment) == 55


def test_cash_dividend_does_not_change_investment_statistics(dividend_session):
    investment = dividend_session.get(Investment, "XASX-ABC")
    assert investment is not None
    before = (
        total_units(investment),
        total_cost(investment),
        average_cost(investment),
        total_profit(investment),
    )

    payment = create_dividend_payment(
        dividend_session,
        DividendPaymentCreate(
            symbol="ABC",
            date=datetime(2026, 2, 1),
            value=12.5,
        ),
    )

    dividend_session.refresh(investment)
    assert payment.value == 12.5
    assert (
        total_units(investment),
        total_cost(investment),
        average_cost(investment),
        total_profit(investment),
    ) == before


def test_dividend_rejects_missing_investment(dividend_session):
    with pytest.raises(InvestmentNotFoundError):
        create_dividend_payment(
            dividend_session,
            DividendPaymentCreate(
                symbol="MISSING",
                date=datetime(2026, 2, 1),
                value=1,
            ),
        )


def test_duplicate_dividend_is_rejected(dividend_session):
    payment = DividendPaymentCreate(
        symbol="ABC",
        date=datetime(2026, 2, 1),
        value=1,
    )
    create_dividend_payment(dividend_session, payment)
    with pytest.raises(DuplicateReturnError):
        create_dividend_payment(dividend_session, payment)


def test_backdated_reinvestment_recalculates_later_sale(dividend_session):
    sale = Sale(
        investment_key="XASX-ABC",
        units=5,
        price_per_unit=10,
        realised_profit_per_unit=5,
        fee=0,
        date=datetime(2026, 3, 1),
        trade_count=1,
    )
    dividend_session.add(sale)
    dividend_session.commit()

    create_dividend_reinvestment(
        dividend_session,
        DividendReinvestmentCreate(
            symbol="ABC",
            date=datetime(2026, 2, 1),
            units=10,
            price_per_unit=7,
        ),
    )

    dividend_session.refresh(sale)
    assert sale.realised_profit_per_unit == 4
