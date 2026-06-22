from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, cast

from app.business.investment import total_cost, total_profit, total_value
from app.models.investment import Investment
from sqlalchemy.orm import Session, selectinload
from sqlmodel import SQLModel, col, select


class PortfolioTotalsRead(SQLModel):
    total_cost: float
    total_value: float
    total_profit: float
    total_profit_percentage: float
    realised_sales_profit: float


class PortfolioHistoryPointRead(SQLModel):
    date: str
    total: float
    cost: float
    profit: float


class RealisedSalePointRead(SQLModel):
    date: str
    investment_key: str
    symbol: str
    units: float
    profit: float
    cumulative_profit: float


class PortfolioRead(SQLModel):
    portfolio_totals: PortfolioTotalsRead
    portfolio_history: list[PortfolioHistoryPointRead]
    realised_sales: list[RealisedSalePointRead]


@dataclass
class _Position:
    units: float = 0
    cost: float = 0
    close: float | None = None


def _day(value: datetime) -> date:
    return value.date()


def _active_investments(db: Session) -> list[Investment]:
    statement = (
        select(Investment)
        .where(Investment.visible.is_(True))
        .options(
            selectinload(cast(Any, Investment.purchases)),
            selectinload(cast(Any, Investment.sales)),
            selectinload(cast(Any, Investment.history)),
            selectinload(cast(Any, Investment.dividend_reinvestments)),
        )
        .order_by(col(Investment.key))
    )
    return list(db.scalars(statement).all())


def _investments_with_sales(db: Session) -> list[Investment]:
    return list(
        db.scalars(
            select(Investment)
            .options(selectinload(cast(Any, Investment.sales)))
            .order_by(col(Investment.key))
        ).all()
    )


def _transactions(investment: Investment) -> list[tuple[date, str, float, float]]:
    transactions = [
        (_day(purchase.date), "purchase", purchase.units, purchase.price_per_unit)
        for purchase in investment.purchases
    ]
    transactions.extend(
        (
            _day(reinvestment.date),
            "reinvestment",
            reinvestment.units,
            reinvestment.price_per_unit,
        )
        for reinvestment in investment.dividend_reinvestments
    )
    transactions.extend(
        (
            _day(sale.date),
            "sale",
            sale.units,
            sale.price_per_unit - sale.realised_profit_per_unit,
        )
        for sale in investment.sales
    )
    return sorted(transactions, key=lambda item: (item[0], item[1]))


def _portfolio_history(
    investments: list[Investment],
    *,
    end_date: date,
) -> list[PortfolioHistoryPointRead]:
    year_start = end_date - timedelta(days=365)
    transaction_dates = [
        transaction[0]
        for investment in investments
        for transaction in _transactions(investment)
        if transaction[0] <= end_date
    ]
    # A portfolio did not exist before its first acquisition. Avoid returning
    # months of zeroes that flatten a newly-created portfolio into invisibility.
    start_date = (
        max(year_start, min(transaction_dates))
        if transaction_dates
        else year_start
    )
    positions = {investment.key: _Position() for investment in investments}
    transaction_indexes = {investment.key: 0 for investment in investments}
    price_indexes = {investment.key: 0 for investment in investments}
    transactions = {
        investment.key: _transactions(investment) for investment in investments
    }
    prices = {
        investment.key: sorted(
            (
                (_day(point.date), point.close)
                for point in investment.history
                if _day(point.date) <= end_date
            ),
            key=lambda item: item[0],
        )
        for investment in investments
    }

    # Establish holdings and last known prices before the visible date range.
    for investment in investments:
        position = positions[investment.key]
        events = transactions[investment.key]
        while (
            transaction_indexes[investment.key] < len(events)
            and events[transaction_indexes[investment.key]][0] < start_date
        ):
            _, kind, units, price = events[transaction_indexes[investment.key]]
            if kind == "sale":
                position.units -= units
                position.cost -= units * price
            else:
                position.units += units
                position.cost += units * price
            transaction_indexes[investment.key] += 1

        share_prices = prices[investment.key]
        while (
            price_indexes[investment.key] < len(share_prices)
            and share_prices[price_indexes[investment.key]][0] < start_date
        ):
            position.close = share_prices[price_indexes[investment.key]][1]
            price_indexes[investment.key] += 1

    history = []
    current_date = start_date
    while current_date <= end_date:
        total_value_on_date = 0.0
        total_cost_on_date = 0.0

        for investment in investments:
            key = investment.key
            position = positions[key]
            events = transactions[key]
            while (
                transaction_indexes[key] < len(events)
                and events[transaction_indexes[key]][0] <= current_date
            ):
                _, kind, units, price = events[transaction_indexes[key]]
                if kind == "sale":
                    position.units -= units
                    position.cost -= units * price
                else:
                    position.units += units
                    position.cost += units * price
                transaction_indexes[key] += 1

            share_prices = prices[key]
            while (
                price_indexes[key] < len(share_prices)
                and share_prices[price_indexes[key]][0] <= current_date
            ):
                position.close = share_prices[price_indexes[key]][1]
                price_indexes[key] += 1

            total_cost_on_date += position.cost
            if position.close is not None:
                total_value_on_date += position.units * position.close

        history.append(
            PortfolioHistoryPointRead(
                date=current_date.isoformat(),
                total=total_value_on_date,
                cost=total_cost_on_date,
                profit=total_value_on_date - total_cost_on_date,
            )
        )
        current_date += timedelta(days=1)

    return history


def _realised_sales(investments: list[Investment]) -> list[RealisedSalePointRead]:
    sales: list[tuple[datetime, Investment, Any]] = sorted(
        (
            (sale.date, investment, sale)
            for investment in investments
            for sale in investment.sales
        ),
        key=lambda item: (item[0], item[1].key, item[2].id or 0),
    )
    result = []
    cumulative = 0.0
    for sale_date, investment, sale in sales:
        profit = sale.realised_profit_per_unit * sale.units - sale.fee
        cumulative += profit
        result.append(
            RealisedSalePointRead(
                date=sale_date.date().isoformat(),
                investment_key=investment.key,
                symbol=investment.symbol or investment.key,
                units=sale.units,
                profit=profit,
                cumulative_profit=cumulative,
            )
        )
    return result


def get_portfolio(db: Session, *, today: date | None = None) -> PortfolioRead:
    investments = _active_investments(db)
    cost = sum(total_cost(investment) for investment in investments)
    value = sum(total_value(investment) for investment in investments)
    profit = sum(total_profit(investment) for investment in investments)
    realised_sales = _realised_sales(_investments_with_sales(db))

    return PortfolioRead(
        portfolio_totals=PortfolioTotalsRead(
            total_cost=cost,
            total_value=value,
            total_profit=profit,
            total_profit_percentage=profit / cost * 100 if cost else 0,
            realised_sales_profit=(
                realised_sales[-1].cumulative_profit if realised_sales else 0
            ),
        ),
        portfolio_history=_portfolio_history(
            investments,
            end_date=today or date.today(),
        ),
        realised_sales=realised_sales,
    )
