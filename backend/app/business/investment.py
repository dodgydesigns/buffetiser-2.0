from app.core.constants import Exchanges, InvestmentType
from app.models.investment import Investment


def generate_key(exchange: Exchanges | str, symbol: str) -> str:
    exchange_value = exchange.value if isinstance(exchange, Exchanges) else exchange
    return f"{exchange_value}-{symbol}"


def total_units(investment: Investment) -> float:
    total = sum(p.units for p in investment.purchases) - sum(
        s.units for s in investment.sales
    )
    return int(total) if investment.type == InvestmentType.SHARES else total


def total_fees(investment: Investment) -> float:
    return sum(p.fee for p in investment.purchases) + sum(
        s.fee for s in investment.sales
    )


def sale_cost_basis_per_unit(sale) -> float:
    return sale.price_per_unit - sale.realized_profit_per_unit


def total_cost_excluding_fees(investment: Investment) -> float:
    cost = sum(p.price_per_unit * p.units for p in investment.purchases)
    cost -= sum(sale_cost_basis_per_unit(s) * s.units for s in investment.sales)
    return cost


def average_cost_excluding_fees(investment: Investment) -> float:
    return (
        total_cost_excluding_fees(investment) / total_units(investment)
        if total_units(investment)
        else 0
    )


def total_cost(investment: Investment) -> float:
    return total_cost_excluding_fees(investment)


def average_cost(investment: Investment) -> float:
    units = total_units(investment)
    return total_cost(investment) / units if units else 0


def total_value(investment: Investment) -> float:
    return total_units(investment) * investment.live_price


def total_profit(investment: Investment) -> float:
    return total_value(investment) - total_cost(investment)


def total_profit_percent(investment: Investment) -> float:
    cost = total_cost(investment)
    return total_profit(investment) / cost * 100 if cost else 0
