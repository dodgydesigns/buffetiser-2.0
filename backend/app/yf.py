"""Small yfinance helper for interactive price checks.

The application price-update workflow lives in ``app.core.price``.
"""

import yfinance as yf


def update_stock_data(ticker_symbol: str):
    ticker = yf.Ticker(f"{ticker_symbol.strip().upper()}.AX")
    return ticker.history(
        period="1d",
        interval="1d",
        auto_adjust=False,
        actions=False,
    )[["Close"]]
