from datetime import date, datetime

import pytest
from app.core.portfolio import get_portfolio
from app.models.dividend import DividendReinvestment
from app.models.history import History
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def test_portfolio_history_applies_purchases_sales_and_reinvestments():
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
                symbol="ABC",
                name="ABC Limited",
                live_price=15,
            )
        )
        session.add_all(
            [
                Purchase(
                    investment_key="XASX-ABC",
                    units=10,
                    price_per_unit=5,
                    fee=0,
                    date=datetime(2026, 6, 18),
                    trade_count=1,
                ),
                DividendReinvestment(
                    investment_key="XASX-ABC",
                    units=2,
                    price_per_unit=8,
                    date=datetime(2026, 6, 19),
                ),
                Sale(
                    investment_key="XASX-ABC",
                    units=3,
                    price_per_unit=12,
                    realised_profit_per_unit=6.5,
                    fee=1,
                    date=datetime(2026, 6, 20),
                    trade_count=1,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 6, 18),
                    close=10,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 6, 19),
                    close=11,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 6, 20),
                    close=12,
                ),
            ]
        )
        session.commit()

        portfolio = get_portfolio(session, today=date(2026, 6, 21))

    points = {point.date: point for point in portfolio.portfolio_history}
    assert portfolio.portfolio_history[0].date == "2026-06-18"
    assert points["2026-06-18"].total == 100
    assert points["2026-06-18"].cost == 50
    assert points["2026-06-19"].total == 132
    assert points["2026-06-19"].cost == 66
    assert points["2026-06-20"].total == 108
    assert points["2026-06-20"].cost == pytest.approx(49.5)
    assert points["2026-06-21"].total == 108

    assert portfolio.portfolio_totals.total_cost == pytest.approx(49.5)
    assert portfolio.portfolio_totals.total_value == 135
    assert portfolio.realised_sales[0].profit == pytest.approx(18.5)
    assert portfolio.portfolio_totals.realised_sales_profit == pytest.approx(18.5)


def test_portfolio_excludes_archived_investments():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(
            Investment(
                key="XASX-OLD",
                symbol="OLD",
                visible=False,
                live_price=100,
            )
        )
        session.add(
            Sale(
                investment_key="XASX-OLD",
                units=2,
                price_per_unit=20,
                realised_profit_per_unit=5,
                fee=1,
                date=datetime(2026, 5, 1),
                trade_count=1,
            )
        )
        session.commit()
        portfolio = get_portfolio(session, today=date(2026, 6, 21))

    assert portfolio.portfolio_totals.total_value == 0
    assert portfolio.portfolio_totals.total_cost == 0
    assert portfolio.portfolio_totals.realised_sales_profit == 9
    assert portfolio.realised_sales[0].symbol == "OLD"
