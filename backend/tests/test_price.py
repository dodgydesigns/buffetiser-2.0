from datetime import datetime
from unittest.mock import Mock, patch

import pandas as pd
import pytest
from app.core.price import (
    PriceHistoryError,
    update_all_prices,
    update_investment_prices,
    yahoo_symbol,
)
from app.models.daily_change import DailyChange
from app.models.history import History
from app.models.investment import Investment
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


def price_frame():
    return pd.DataFrame(
        {
            "High": [10.5, 11.5],
            "Low": [9.5, 10.25],
            "Close": [10.0, 11.0],
            "Volume": [1000, 1250],
        },
        index=pd.to_datetime(["2026-06-19", "2026-06-20"], utc=True),
    )


def test_yahoo_symbol_uses_exchange_suffix():
    assert (
        yahoo_symbol(Investment(key="XASX-VAS", symbol="vas"))
        == "VAS.AX"
    )
    assert yahoo_symbol(Investment(key="XNAS-AAPL", symbol="aapl")) == "AAPL"


def test_update_prices_saves_history_live_price_and_daily_change(engine):
    with Session(engine) as session:
        investment = Investment(key="XASX-VAS", symbol="VAS", name="Vanguard")
        session.add(investment)
        session.commit()
        session.refresh(investment)

        ticker = Mock()
        ticker.history.return_value = price_frame()
        with patch("app.core.price.yf.Ticker", return_value=ticker):
            count = update_investment_prices(session, investment, period="1y")

        assert count == 2
        ticker.history.assert_called_once_with(
            period="1y",
            interval="1d",
            auto_adjust=False,
            actions=False,
        )

        session.refresh(investment)
        assert investment.live_price == 11

        history = session.scalars(
            select(History).order_by(History.date)
        ).all()
        assert [(point.date, point.close) for point in history] == [
            (datetime(2026, 6, 19), 10),
            (datetime(2026, 6, 20), 11),
        ]
        assert history[-1].high == 11.5
        assert history[-1].low == 10.25
        assert history[-1].volume == 1250

        change = session.scalar(select(DailyChange))
        assert change is not None
        assert change.daily_change == 1
        assert change.daily_change_percent == 10


def test_update_prices_upserts_existing_history(engine):
    with Session(engine) as session:
        investment = Investment(key="XASX-VAS", symbol="VAS")
        session.add(investment)
        session.add(
            History(
                investment_key="XASX-VAS",
                date=datetime(2026, 6, 20),
                close=1,
            )
        )
        session.commit()
        session.refresh(investment)

        ticker = Mock()
        ticker.history.return_value = price_frame()
        with patch("app.core.price.yf.Ticker", return_value=ticker):
            update_investment_prices(session, investment)

        history = session.scalars(select(History)).all()
        assert len(history) == 2
        assert max(history, key=lambda point: point.date).close == 11


def test_update_all_continues_when_one_ticker_fails(engine):
    with Session(engine) as session:
        session.add_all(
            [
                Investment(key="XASX-VAS", symbol="VAS"),
                Investment(key="XASX-MISSING", symbol="MISSING"),
                Investment(key="XASX-HIDDEN", symbol="HIDDEN", visible=False),
            ]
        )
        session.commit()

        def history_for_symbol(symbol):
            ticker = Mock()
            if symbol == "MISSING.AX":
                ticker.history.side_effect = RuntimeError("not found")
            else:
                ticker.history.return_value = price_frame()
            return ticker

        with patch("app.core.price.yf.Ticker", side_effect=history_for_symbol):
            result = update_all_prices(session)

        assert result["updated"] == ["XASX-VAS"]
        assert result["failed_count"] == 1
        assert "XASX-MISSING" in result["failed"]
        assert "XASX-HIDDEN" not in result["updated"]


def test_update_prices_rejects_empty_history(engine):
    with Session(engine) as session:
        investment = Investment(key="XASX-VAS", symbol="VAS")
        ticker = Mock()
        ticker.history.return_value = pd.DataFrame()

        with patch("app.core.price.yf.Ticker", return_value=ticker):
            with pytest.raises(PriceHistoryError):
                update_investment_prices(session, investment)
