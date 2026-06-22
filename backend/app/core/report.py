from typing import Any, cast

from app.models.dividend import DividendPayment, DividendReinvestment
from app.models.investment import Investment
from sqlalchemy.orm import Session, selectinload
from sqlmodel import col, select


def _format_date(value) -> str:
    return value.strftime("%d/%m/%Y")


def get_investment_reports(db: Session) -> dict[str, dict]:
    investments = db.scalars(
        select(Investment)
        .options(
            selectinload(cast(Any, Investment.purchases)),
            selectinload(cast(Any, Investment.sales)),
        )
        .order_by(col(Investment.symbol), col(Investment.key))
    ).all()

    reports: dict[str, dict] = {}
    for investment in investments:
        transactions = [
            {
                "date": _format_date(purchase.date),
                "type": "purchase",
                "units": purchase.units,
                "price_per_unit": purchase.price_per_unit,
                "fee": purchase.fee,
            }
            for purchase in investment.purchases
        ]
        transactions.extend(
            {
                "date": _format_date(sale.date),
                "type": "sale",
                "units": sale.units,
                "price_per_unit": sale.price_per_unit,
                "fee": sale.fee,
                "realized_profit_per_unit": sale.realized_profit_per_unit,
            }
            for sale in investment.sales
        )

        dividend_payments = db.scalars(
            select(DividendPayment).where(
                col(DividendPayment.investment_key) == investment.key
            )
        ).all()
        transactions.extend(
            {
                "payment_date": _format_date(payment.date),
                "type": "dividend",
                "value": payment.value,
            }
            for payment in dividend_payments
        )

        reinvestments = db.scalars(
            select(DividendReinvestment).where(
                col(DividendReinvestment.investment_key) == investment.key
            )
        ).all()
        transactions.extend(
            {
                "reinvestment_date": _format_date(reinvestment.date),
                "type": "reinvestment",
                "units": reinvestment.units,
                "price_per_unit": reinvestment.price_per_unit,
            }
            for reinvestment in reinvestments
        )

        transactions.sort(
            key=lambda transaction: (
                transaction.get("date")
                or transaction.get("payment_date")
                or transaction.get("reinvestment_date")
                or ""
            )
        )
        reports[investment.key] = {
            "symbol": investment.symbol or investment.key,
            "name": investment.name or investment.symbol or investment.key,
            "archived": not investment.visible,
            "transactions": transactions,
        }

    return reports
