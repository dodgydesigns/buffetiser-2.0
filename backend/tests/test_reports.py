from datetime import datetime

from app.db.session import get_db
from app.main import app
from app.models.dividend import DividendPayment, DividendReinvestment
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine


def test_reports_include_archived_investments_and_transactions(client):
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
                visible=False,
            )
        )
        session.add_all(
            [
                Purchase(
                    investment_key="XASX-ABC",
                    units=10,
                    price_per_unit=5,
                    fee=1,
                    date=datetime(2026, 1, 1),
                    trade_count=1,
                ),
                Sale(
                    investment_key="XASX-ABC",
                    units=2,
                    price_per_unit=8,
                    realised_profit_per_unit=3,
                    fee=1,
                    date=datetime(2026, 2, 1),
                    trade_count=1,
                ),
                DividendPayment(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 3, 1),
                    value=4,
                ),
                DividendReinvestment(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 4, 1),
                    units=1,
                    price_per_unit=6,
                ),
            ]
        )
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/reports/")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    report = response.json()["XASX-ABC"]
    assert report["archived"] is True
    assert [transaction["type"] for transaction in report["transactions"]] == [
        "purchase",
        "sale",
        "dividend",
        "reinvestment",
    ]


def test_reports_sort_dates_chronologically_across_years(client):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Investment(key="XASX-ABC", symbol="ABC"))
        session.add_all(
            [
                Purchase(
                    investment_key="XASX-ABC",
                    units=1,
                    price_per_unit=1,
                    fee=0,
                    date=datetime(2025, 12, 31),
                    trade_count=1,
                ),
                Purchase(
                    investment_key="XASX-ABC",
                    units=1,
                    price_per_unit=1,
                    fee=0,
                    date=datetime(2026, 1, 1),
                    trade_count=1,
                ),
            ]
        )
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/reports/")
    finally:
        app.dependency_overrides.clear()

    dates = [
        transaction["date"]
        for transaction in response.json()["XASX-ABC"]["transactions"]
    ]
    assert dates == ["31/12/2025", "01/01/2026"]
