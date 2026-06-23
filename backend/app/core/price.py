from __future__ import annotations

import logging
from datetime import datetime
from math import isfinite
from typing import Any

import yfinance as yf
from app.models.daily_change import DailyChange
from app.models.history import History
from app.models.investment import Investment
from sqlalchemy.orm import Session
from sqlmodel import col, select

_logger = logging.getLogger(__name__)

# Yahoo Finance suffixes for the exchanges offered by the purchase dialog.
_YAHOO_EXCHANGE_SUFFIX = {
    "XASX": ".AX",
    "XAMS": ".AS",
    "XBOM": ".BO",
    "XBRU": ".BR",
    "XFRA": ".F",
    "XHKG": ".HK",
    "XJPX": ".T",
    "XKOS": ".KS",
    "XLIS": ".LS",
    "XLON": ".L",
    "XMIL": ".MI",
    "XMSM": ".OM",
    "XNAS": "",
    "XNSE": ".NS",
    "XNYS": "",
    "XOSL": ".OL",
    "XSAU": ".SR",
    "XSHE": ".SZ",
    "XSHG": ".SS",
    "XSWX": ".SW",
    "XTAI": ".TW",
    "XTSE": ".TO",
}


class PriceHistoryError(Exception):
    pass


def yahoo_symbol(investment: Investment) -> str:
    exchange = investment.exchange.upper()
    key_parts = investment.key.upper().split("-")
    if len(key_parts) >= 2 and key_parts[-2] in _YAHOO_EXCHANGE_SUFFIX:
        inferred_exchange = key_parts[-2]
        if exchange == "XASX" and inferred_exchange != "XASX":
            exchange = inferred_exchange
    symbol = (investment.symbol or "").strip().upper()
    if not symbol:
        raise PriceHistoryError(f"{investment.key} does not have a symbol")

    suffix = _YAHOO_EXCHANGE_SUFFIX.get(exchange)
    if suffix is None:
        raise PriceHistoryError(f"Exchange {exchange} is not supported")

    # Respect a Yahoo-formatted symbol if one was entered explicitly.
    return symbol if "." in symbol or not suffix else f"{symbol}{suffix}"


def _number(value: Any, default: float = 0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if isfinite(number) else default


def _date_from_index(value: Any) -> datetime:
    python_value = value.to_pydatetime() if hasattr(value, "to_pydatetime") else value
    if not isinstance(python_value, datetime):
        python_value = datetime.combine(python_value, datetime.min.time())
    return datetime(
        python_value.year,
        python_value.month,
        python_value.day,
    )


def _set_daily_change(
    db: Session,
    investment: Investment,
    closes: list[float],
) -> None:
    symbol = investment.symbol or investment.key
    changes = db.scalars(
        select(DailyChange)
        .where(col(DailyChange.symbol) == symbol)
        .order_by(col(DailyChange.id))
    ).all()
    change = changes[0] if changes else DailyChange(symbol=symbol)
    for duplicate in changes[1:]:
        db.delete(duplicate)

    if len(closes) >= 2:
        previous_close = closes[-2]
        latest_close = closes[-1]
        change.daily_change = latest_close - previous_close
        change.daily_change_percent = (
            change.daily_change / previous_close * 100 if previous_close else 0
        )
    else:
        change.daily_change = 0
        change.daily_change_percent = 0

    db.add(change)


def update_investment_prices(
    db: Session,
    investment: Investment,
    *,
    period: str = "5d",
) -> int:
    ticker_symbol = yahoo_symbol(investment)

    try:
        frame = yf.Ticker(ticker_symbol).history(
            period=period,
            interval="1d",
            auto_adjust=False,
            actions=False,
        )
    except Exception as exc:
        raise PriceHistoryError(
            f"Could not download prices for {ticker_symbol}"
        ) from exc

    if frame.empty or "Close" not in frame:
        raise PriceHistoryError(f"No price history found for {ticker_symbol}")

    rows: list[tuple[datetime, float, float, float, int]] = []
    for index, row in frame.sort_index().iterrows():
        close = _number(row.get("Close"))
        if close <= 0:
            continue
        rows.append(
            (
                _date_from_index(index),
                _number(row.get("Low"), close),
                _number(row.get("High"), close),
                close,
                max(0, int(_number(row.get("Volume")))),
            )
        )

    if not rows:
        raise PriceHistoryError(f"No valid closing prices found for {ticker_symbol}")

    dates = [row[0] for row in rows]
    existing = {
        point.date: point
        for point in db.scalars(
            select(History).where(
                col(History.investment_key) == investment.key,
                col(History.date).in_(dates),
            )
        ).all()
    }

    for date, low, high, close, volume in rows:
        point = existing.get(date)
        if point is None:
            point = History(investment_key=investment.key, date=date)
        point.low = low
        point.high = high
        point.close = close
        point.volume = volume
        db.add(point)

    closes = [row[3] for row in rows]
    investment.live_price = closes[-1]
    db.add(investment)
    _set_daily_change(db, investment, closes)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    _logger.info(
        "Updated %s with %s daily price rows from %s",
        investment.key,
        len(rows),
        ticker_symbol,
    )
    return len(rows)


def update_all_prices(
    db: Session,
    *,
    owner_id: int | None = None,
) -> dict[str, Any]:
    statement = select(Investment).where(Investment.visible.is_(True))
    if owner_id is not None:
        statement = statement.where(Investment.owner_id == owner_id)
    investments = db.scalars(
        statement
        .order_by(col(Investment.key))
    ).all()
    updated: list[str] = []
    failed: dict[str, str] = {}

    for investment in investments:
        try:
            # Refresh the rolling year so the individual and portfolio charts
            # remain complete even after missed update days.
            update_investment_prices(db, investment, period="1y")
            updated.append(investment.key)
        except PriceHistoryError as exc:
            db.rollback()
            failed[investment.key] = str(exc)
            _logger.warning("Price update failed for %s: %s", investment.key, exc)

    return {
        "updated": updated,
        "failed": failed,
        "updated_count": len(updated),
        "failed_count": len(failed),
    }
