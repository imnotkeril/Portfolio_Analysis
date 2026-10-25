"""
Portfolio optimization helpers without Streamlit.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from src.utils.calculations import PortfolioAnalytics
from src.utils.optimization import PortfolioOptimizer


def load_returns_for_tickers(data_fetcher, tickers: List[str], start_date_str: str, end_date_str: str) -> pd.DataFrame:
    prices_data = data_fetcher.get_batch_data(tickers, start_date_str, end_date_str)
    if not prices_data or all(df.empty for df in prices_data.values()):
        raise ValueError("Failed to load historical data. Please check tickers or change period.")

    close_prices = pd.DataFrame()
    for ticker, df in prices_data.items():
        if not df.empty:
            if "Adj Close" in df.columns:
                close_prices[ticker] = df["Adj Close"]
            elif "Close" in df.columns:
                close_prices[ticker] = df["Close"]

    return PortfolioAnalytics.calculate_returns(close_prices)


def run_optimization(
    data_fetcher,
    tickers: List[str],
    method: str,
    start_date_str: str,
    end_date_str: str,
    risk_free_rate: float = 0.0,
    min_weight: float = 0.0,
    max_weight: float = 1.0,
    target_return: Optional[float] = None,
    sector_constraints: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run PortfolioOptimizer.optimize_portfolio on historical returns for tickers.
    """
    returns = load_returns_for_tickers(data_fetcher, tickers, start_date_str, end_date_str)
    if returns.empty:
        raise ValueError("No returns computed for the given universe.")

    args: Dict[str, Any] = {
        "risk_free_rate": risk_free_rate,
        "min_weight": min_weight,
        "max_weight": max_weight,
    }
    if method == "markowitz" and target_return is not None:
        args["target_return"] = target_return
    if sector_constraints:
        args["sector_constraints"] = sector_constraints

    result = PortfolioOptimizer.optimize_portfolio(returns, method=method, **args)
    return result
