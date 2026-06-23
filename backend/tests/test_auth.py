from datetime import datetime

from app.core.auth import current_admin, current_user
from app.db.session import get_db
from app.main import app
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.user import User
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def _test_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


def test_first_account_adopts_existing_portfolio_and_can_log_in(client):
    engine = _test_engine()
    with Session(engine) as session:
        session.add(
            User(
                id=1,
                username="__bootstrap__",
                display_name="Initial administrator",
                password_hash="!",
                is_admin=True,
                is_bootstrap=True,
            )
        )
        session.add(
            Investment(
                key="XASX-ABC",
                owner_id=1,
                symbol="ABC",
                name="ABC Limited",
            )
        )
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides.pop(current_user, None)
    app.dependency_overrides.pop(current_admin, None)
    try:
        status_response = client.get("/api/v1/auth/status")
        setup_response = client.post(
            "/api/v1/auth/setup",
            json={
                "username": "owner",
                "display_name": "Portfolio Owner",
                "password": "a-secure-password",
            },
        )
        portfolio_response = client.get(
            "/api/v1/all?include_history=false"
        )
    finally:
        app.dependency_overrides.clear()

    assert status_response.json() == {"setup_required": True}
    assert setup_response.status_code == 200
    assert setup_response.json()["is_admin"] is True
    assert portfolio_response.status_code == 200
    assert portfolio_response.json()["all_investment_data"][0]["symbol"] == "ABC"


def test_users_cannot_read_or_mutate_each_others_investments(client):
    engine = _test_engine()
    owner_one = User(
        id=1,
        username="one",
        display_name="One",
        password_hash="!",
    )
    owner_two = User(
        id=2,
        username="two",
        display_name="Two",
        password_hash="!",
    )
    with Session(engine) as session:
        session.add_all([owner_one, owner_two])
        session.add_all(
            [
                Investment(
                    key="XASX-ONE",
                    owner_id=1,
                    symbol="ONE",
                    name="Owner One",
                ),
                Investment(
                    key="u2-XASX-TWO",
                    owner_id=2,
                    symbol="TWO",
                    name="Owner Two",
                ),
                Purchase(
                    investment_key="XASX-ONE",
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
    app.dependency_overrides[current_user] = lambda: User(
        id=2,
        username="two",
        display_name="Two",
        password_hash="!",
    )
    try:
        list_response = client.get("/api/v1/all?include_history=false")
        history_response = client.get(
            "/api/v1/investments/XASX-ONE/history"
        )
        archive_response = client.patch(
            "/api/v1/investments/XASX-ONE/archive"
        )
        sale_response = client.post(
            "/api/v1/sale",
            json={
                "investment_key": "XASX-ONE",
                "units": 1,
                "price_per_unit": 2,
                "fee": 0,
                "date": "2026-02-01T00:00:00",
                "trade_count": 1,
            },
        )
    finally:
        app.dependency_overrides.clear()

    symbols = [
        item["symbol"]
        for item in list_response.json()["all_investment_data"]
    ]
    assert symbols == ["TWO"]
    assert history_response.status_code == 404
    assert archive_response.status_code == 404
    assert sale_response.status_code == 404

    with Session(engine) as session:
        assert session.get(Investment, "XASX-ONE").visible is True
