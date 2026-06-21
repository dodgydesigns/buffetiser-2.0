from datetime import datetime

from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine, select

from app.db.session import get_db
from app.main import app
from app.models.daily_change import DailyChange
from app.models.dividend import DividendPayment, DividendReinvestment
from app.models.history import History
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale


def test_delete_investment_removes_investment_and_related_records(client):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(Investment(key="XASX-ABC", name="ABC", symbol="ABC"))
        session.add_all(
            [
                Purchase(
                    investment_key="XASX-ABC",
                    units=1,
                    price_per_unit=10,
                    fee=1,
                    date=datetime(2026, 1, 1),
                    trade_count=1,
                ),
                Sale(
                    investment_key="XASX-ABC",
                    units=1,
                    price_per_unit=11,
                    fee=1,
                    date=datetime(2026, 1, 2),
                    trade_count=1,
                ),
                History(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 1, 1),
                ),
                DividendPayment(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 1, 3),
                    value=2,
                ),
                DividendReinvestment(
                    investment_key="XASX-ABC",
                    date=datetime(2026, 1, 4),
                    units=1,
                    price_per_unit=10,
                ),
                DailyChange(symbol="ABC", daily_change=1),
            ]
        )
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.delete("/api/v1/investments/XASX-ABC")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204

    with Session(engine) as session:
        assert session.get(Investment, "XASX-ABC") is None
        for model in (
            Purchase,
            Sale,
            History,
            DividendPayment,
            DividendReinvestment,
            DailyChange,
        ):
            assert session.exec(select(model)).all() == []


def test_delete_investment_returns_not_found(client):
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
        response = client.delete("/api/v1/investments/missing")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json() == {"detail": "Investment not found"}
