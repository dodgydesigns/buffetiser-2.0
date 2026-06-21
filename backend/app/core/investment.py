from typing import Any, cast

from app.business.investment import (
    average_cost,
    total_cost,
    total_profit,
    total_profit_percent,
    total_units,
)
from app.models.daily_change import DailyChange
from app.models.dividend import DividendPayment, DividendReinvestment
from app.models.history import History
from app.models.investment import Investment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload
from sqlmodel import SQLModel, col, select


class InvestmentNotFoundError(Exception):
    pass


class InvestmentHistoryRead(SQLModel):
    date: str
    low: float
    high: float
    close: float
    volume: int


class InvestmentSummaryRead(SQLModel):
    id: str
    name: str
    symbol: str
    visible: bool
    last_price: float
    daily_change: float
    daily_change_percent: float
    units: float
    average_cost: float
    total_cost: float
    profit: float
    profit_percent: float
    history: list[InvestmentHistoryRead]


class AllInvestmentsRead(SQLModel):
    all_investment_data: list[InvestmentSummaryRead]


def _daily_changes_by_symbol(db: Session) -> dict[str, DailyChange]:
    changes = db.scalars(select(DailyChange).order_by(col(DailyChange.id))).all()
    return {change.symbol: change for change in changes}


def get_all_investments(db: Session) -> AllInvestmentsRead:
    statement = (
        select(Investment)
        .options(
            selectinload(cast(Any, Investment.purchases)),
            selectinload(cast(Any, Investment.sales)),
            selectinload(cast(Any, Investment.history)),
        )
        .order_by(col(Investment.symbol), col(Investment.key))
    )
    investments = db.scalars(statement).all()
    daily_changes = _daily_changes_by_symbol(db)

    summaries = []
    for investment in investments:
        change = daily_changes.get(investment.symbol or "")
        history = [
            InvestmentHistoryRead(
                date=point.date.date().isoformat(),
                low=point.low,
                high=point.high,
                close=point.close,
                volume=point.volume,
            )
            for point in sorted(investment.history, key=lambda point: point.date)
        ]

        summaries.append(
            InvestmentSummaryRead(
                id=investment.key,
                name=investment.name or investment.symbol or investment.key,
                symbol=investment.symbol or investment.key,
                visible=investment.visible,
                last_price=investment.live_price,
                daily_change=change.daily_change if change else 0,
                daily_change_percent=change.daily_change_percent if change else 0,
                units=total_units(investment),
                average_cost=average_cost(investment),
                total_cost=total_cost(investment),
                profit=total_profit(investment),
                profit_percent=total_profit_percent(investment),
                history=history,
            )
        )

    return AllInvestmentsRead(all_investment_data=summaries)


def delete_investment(db: Session, investment_key: str) -> None:
    investment = db.get(Investment, investment_key)
    if investment is None:
        raise InvestmentNotFoundError

    symbol = investment.symbol
    dependent_models = (
        DividendPayment,
        DividendReinvestment,
        History,
        Purchase,
        Sale,
    )

    try:
        for model in dependent_models:
            db.execute(delete(model).where(col(model.investment_key) == investment_key))

        db.delete(investment)

        if symbol:
            remaining_symbol = db.scalar(
                select(Investment.key)
                .where(
                    col(Investment.symbol) == symbol,
                    col(Investment.key) != investment_key,
                )
                .limit(1)
            )
            if remaining_symbol is None:
                db.execute(delete(DailyChange).where(col(DailyChange.symbol) == symbol))

        db.commit()
    except Exception:
        db.rollback()
        raise
