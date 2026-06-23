from typing import Any, cast

from app.business.investment import (
    average_cost,
    total_cost,
    total_profit,
    total_profit_percent,
    total_units,
)
from app.models.daily_change import DailyChange
from app.models.investment import Investment
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


def get_all_investments(
    db: Session,
    owner_id: int,
    *,
    include_history: bool = True,
) -> AllInvestmentsRead:
    options = [
        selectinload(cast(Any, Investment.purchases)),
        selectinload(cast(Any, Investment.sales)),
        selectinload(cast(Any, Investment.dividend_reinvestments)),
    ]
    if include_history:
        options.append(selectinload(cast(Any, Investment.history)))

    statement = (
        select(Investment)
        .where(
            col(Investment.owner_id) == owner_id,
            col(Investment.visible).is_(True),
        )
        .options(*options)
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
        ] if include_history else []

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


def get_investment_history(
    db: Session,
    investment_key: str,
    owner_id: int,
) -> list[InvestmentHistoryRead]:
    investment = db.scalar(
        select(Investment)
        .where(
            col(Investment.key) == investment_key,
            col(Investment.owner_id) == owner_id,
        )
        .options(selectinload(cast(Any, Investment.history)))
    )
    if investment is None:
        raise InvestmentNotFoundError
    return [
        InvestmentHistoryRead(
            date=point.date.date().isoformat(),
            low=point.low,
            high=point.high,
            close=point.close,
            volume=point.volume,
        )
        for point in sorted(investment.history, key=lambda point: point.date)
    ]


def archive_investment(
    db: Session,
    investment_key: str,
    owner_id: int,
) -> None:
    investment = db.scalar(
        select(Investment).where(
            col(Investment.key) == investment_key,
            col(Investment.owner_id) == owner_id,
        )
    )
    if investment is None:
        raise InvestmentNotFoundError

    try:
        investment.visible = False
        db.add(investment)
        db.commit()
    except Exception:
        db.rollback()
        raise
