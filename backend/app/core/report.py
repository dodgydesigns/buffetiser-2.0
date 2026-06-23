from typing import Any, cast

from app.models.investment import Investment
from sqlalchemy.orm import Session, selectinload
from sqlmodel import col, select


def _format_date(value) -> str:
    return value.strftime("%d/%m/%Y")


def get_investment_reports(
    db: Session,
    owner_id: int = 1,
) -> dict[str, dict]:
    investments = db.scalars(
        select(Investment)
        .where(Investment.owner_id == owner_id)
        .options(
            selectinload(cast(Any, Investment.purchases)),
            selectinload(cast(Any, Investment.sales)),
            selectinload(cast(Any, Investment.dividend_payments)),
            selectinload(cast(Any, Investment.dividend_reinvestments)),
        )
        .order_by(col(Investment.symbol), col(Investment.key))
    ).all()

    reports: dict[str, dict] = {}
    for investment in investments:
        dated_transactions = [
            (
                purchase.date,
                {
                    "date": _format_date(purchase.date),
                    "type": "purchase",
                    "units": purchase.units,
                    "price_per_unit": purchase.price_per_unit,
                    "fee": purchase.fee,
                },
            )
            for purchase in investment.purchases
        ]
        dated_transactions.extend(
            (
                sale.date,
                {
                    "date": _format_date(sale.date),
                    "type": "sale",
                    "units": sale.units,
                    "price_per_unit": sale.price_per_unit,
                    "fee": sale.fee,
                    "realised_profit_per_unit": sale.realised_profit_per_unit,
                },
            )
            for sale in investment.sales
        )
        dated_transactions.extend(
            (
                payment.date,
                {
                    "payment_date": _format_date(payment.date),
                    "type": "dividend",
                    "value": payment.value,
                },
            )
            for payment in investment.dividend_payments
        )
        dated_transactions.extend(
            (
                reinvestment.date,
                {
                    "reinvestment_date": _format_date(reinvestment.date),
                    "type": "reinvestment",
                    "units": reinvestment.units,
                    "price_per_unit": reinvestment.price_per_unit,
                },
            )
            for reinvestment in investment.dividend_reinvestments
        )
        dated_transactions.sort(key=lambda item: item[0])
        transactions = [transaction for _, transaction in dated_transactions]
        reports[investment.key] = {
            "symbol": investment.symbol or investment.key,
            "name": investment.name or investment.symbol or investment.key,
            "archived": not investment.visible,
            "transactions": transactions,
        }

    return reports
