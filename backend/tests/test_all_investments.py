from datetime import datetime

from app.db.session import get_db
from app.main import app
from app.models.daily_change import DailyChange
from app.models.history import History
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def test_all_investments_returns_computed_dashboard_data(client):
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
                live_price=15,
            )
        )
        session.add_all(
            [
                Purchase(
                    investment_key="XASX-ABC",
                    units=10,
                    price_per_unit=8,
                    fee=2,
                    date=datetime(2026, 1, 1),
                    trade_count=1,
                ),
                Sale(
                    investment_key="XASX-ABC",
                    units=2,
                    price_per_unit=10,
                    realized_profit_per_unit=2,
                    fee=1,
                    date=datetime(2026, 2, 1),
                    trade_count=1,
                ),
                DailyChange(
                    symbol="ABC",
                    daily_change=0.5,
                    daily_change_percent=3.45,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 2, 2),
                    low=14,
                    high=16,
                    close=15,
                    volume=200,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 2, 1),
                    low=13,
                    high=15,
                    close=14,
                    volume=100,
                ),
            ]
        )
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/all")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "all_investment_data": [
            {
                "id": "XASX-ABC",
                "name": "ABC Limited",
                "symbol": "ABC",
                "visible": True,
                "last_price": 15.0,
                "daily_change": 0.5,
                "daily_change_percent": 3.45,
                "units": 8.0,
                "average_cost": 8.0,
                "total_cost": 64.0,
                "profit": 56.0,
                "profit_percent": 87.5,
                "history": [
                    {
                        "date": "2026-02-01",
                        "low": 13.0,
                        "high": 15.0,
                        "close": 14.0,
                        "volume": 100,
                    },
                    {
                        "date": "2026-02-02",
                        "low": 14.0,
                        "high": 16.0,
                        "close": 15.0,
                        "volume": 200,
                    },
                ],
            }
        ]
    }


def test_all_investments_handles_an_empty_database(client):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/all")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"all_investment_data": []}
