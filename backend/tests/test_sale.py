from datetime import datetime

import pytest
from app.core.sale import (
    DuplicateSaleError,
    InsufficientUnitsError,
    InvestmentNotFoundError,
    SaleCreate,
    create_sale,
)
from app.business.investment import average_cost, total_cost, total_profit
from app.models.investment import Investment
from app.models.purchase import Purchase
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine


@pytest.fixture
def sale_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(Investment(key="XASX-ABC", name="ABC", symbol="ABC"))
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


def sale_input(**overrides):
    values = {
        "investment_key": "XASX-ABC",
        "units": 4,
        "price_per_unit": 8,
        "fee": 1,
        "date": datetime(2026, 2, 1),
        "trade_count": 1,
    }
    values.update(overrides)
    return SaleCreate(**values)


def test_create_sale_reduces_available_units(sale_session):
    sale = create_sale(sale_session, sale_input())

    assert sale.investment_key == "XASX-ABC"
    assert sale.units == 4
    assert sale.realised_profit_per_unit == 3

    investment = sale_session.get(Investment, "XASX-ABC")
    assert investment is not None
    assert sum(p.units for p in investment.purchases) - sum(
        s.units for s in investment.sales
    ) == 6
    assert average_cost(investment) == 5
    assert total_cost(investment) == 30


def test_average_buy_price_remains_weighted_after_sale_and_new_purchase(
    sale_session,
):
    create_sale(sale_session, sale_input())
    sale_session.add(
        Purchase(
            investment_key="XASX-ABC",
            units=4,
            price_per_unit=11,
            fee=0,
            date=datetime(2026, 3, 1),
            trade_count=1,
        )
    )
    sale_session.commit()

    investment = sale_session.get(Investment, "XASX-ABC")
    assert investment is not None
    assert average_cost(investment) == pytest.approx(7.4)
    assert total_cost(investment) == pytest.approx(74)

    investment.live_price = 9
    assert total_profit(investment) == pytest.approx(16)


def test_create_sale_rejects_overselling(sale_session):
    with pytest.raises(InsufficientUnitsError) as error:
        create_sale(sale_session, sale_input(units=11))

    assert error.value.available_units == 10


def test_create_sale_rejects_missing_investment(sale_session):
    with pytest.raises(InvestmentNotFoundError):
        create_sale(sale_session, sale_input(investment_key="missing"))


def test_create_sale_rejects_duplicate(sale_session):
    create_sale(sale_session, sale_input())

    with pytest.raises(DuplicateSaleError):
        create_sale(sale_session, sale_input())


def test_backdated_purchase_recalculates_later_sale(sale_session):
    sale = create_sale(sale_session, sale_input())
    assert sale.realised_profit_per_unit == 3

    from app.core.purchase import PurchaseCreate, create_purchase

    create_purchase(
        sale_session,
        PurchaseCreate(
            symbol="ABC",
            units=10,
            price_per_unit=7,
            fee=0,
            date=datetime(2026, 1, 15),
            trade_count=1,
        ),
    )

    sale_session.refresh(sale)
    assert sale.realised_profit_per_unit == 2


def test_backdated_sale_uses_units_available_on_sale_date(sale_session):
    with pytest.raises(InsufficientUnitsError) as error:
        create_sale(
            sale_session,
            sale_input(
                units=11,
                date=datetime(2025, 12, 31),
            ),
        )

    assert error.value.available_units == 0
