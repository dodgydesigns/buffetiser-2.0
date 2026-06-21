from datetime import datetime

from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.core.purchase import PurchaseCreate, create_purchase
from app.models.investment import Investment


def test_create_purchase_uses_name_for_new_investment():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        create_purchase(
            session,
            PurchaseCreate(
                symbol="ABC",
                name="ABC Limited",
                units=10,
                price_per_unit=5,
                fee=1,
                date=datetime(2026, 1, 1),
                trade_count=1,
            ),
        )

        investment = session.get(Investment, "XASX-ABC")
        assert investment is not None
        assert investment.name == "ABC Limited"
