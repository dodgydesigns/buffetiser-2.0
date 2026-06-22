from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from app.models.dividend import DividendReinvestment
from app.models.purchase import Purchase
from app.models.sale import Sale
from sqlalchemy.orm import Session
from sqlmodel import col, select


class InsufficientUnitsAtDateError(Exception):
    def __init__(self, available_units: float, sale_date: datetime):
        self.available_units = available_units
        self.sale_date = sale_date
        super().__init__(
            f"Only {available_units} units were available on {sale_date.date()}"
        )


@dataclass
class _LedgerEntry:
    date: datetime
    priority: int
    identifier: int
    kind: Literal["acquisition", "sale"]
    units: float
    price_per_unit: float
    sale: Sale | None = None


def recalculate_sales(db: Session, investment_key: str) -> None:
    """Rebuild weighted-average sale cost bases in chronological order."""
    purchases = db.scalars(
        select(Purchase).where(col(Purchase.investment_key) == investment_key)
    ).all()
    reinvestments = db.scalars(
        select(DividendReinvestment).where(
            col(DividendReinvestment.investment_key) == investment_key
        )
    ).all()
    sales = db.scalars(
        select(Sale).where(col(Sale.investment_key) == investment_key)
    ).all()

    entries = [
        _LedgerEntry(
            date=purchase.date,
            priority=0,
            identifier=purchase.id or 0,
            kind="acquisition",
            units=purchase.units,
            price_per_unit=purchase.price_per_unit,
        )
        for purchase in purchases
    ]
    entries.extend(
        _LedgerEntry(
            date=reinvestment.date,
            priority=1,
            identifier=reinvestment.id or 0,
            kind="acquisition",
            units=reinvestment.units,
            price_per_unit=reinvestment.price_per_unit,
        )
        for reinvestment in reinvestments
    )
    entries.extend(
        _LedgerEntry(
            date=sale.date,
            priority=2,
            identifier=sale.id or 0,
            kind="sale",
            units=sale.units,
            price_per_unit=sale.price_per_unit,
            sale=sale,
        )
        for sale in sales
    )
    entries.sort(
        key=lambda entry: (entry.date, entry.priority, entry.identifier)
    )

    held_units = 0.0
    remaining_cost = 0.0
    for entry in entries:
        if entry.kind == "acquisition":
            held_units += entry.units
            remaining_cost += entry.units * entry.price_per_unit
            continue

        if entry.units > held_units + 1e-9:
            raise InsufficientUnitsAtDateError(held_units, entry.date)

        average_cost = remaining_cost / held_units if held_units else 0
        if entry.sale is not None:
            entry.sale.realised_profit_per_unit = (
                entry.price_per_unit - average_cost
            )
            db.add(entry.sale)

        held_units -= entry.units
        remaining_cost -= entry.units * average_cost

