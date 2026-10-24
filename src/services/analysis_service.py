"""
Portfolio data loading and metrics without Streamlit (shared by Streamlit pages and FastAPI).
"""
from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from src.utils.calculations import PortfolioAnalytics

logger = logging.getLogger(__name__)


def load_portfolio_data(data_fetcher, tickers, start_date_str, end_date_str, benchmark=None):
    """
    Loads historical data for tickers and optional benchmark.

    Returns:
        Tuple (close_prices, returns, valid_tickers, benchmark_returns, prices_data)
    """
    if benchmark and benchmark not in tickers:
        tickers_to_load = list(tickers) + [benchmark]
    else:
        tickers_to_load = list(tickers)

    prices_data = data_fetcher.get_batch_data(tickers_to_load, start_date_str, end_date_str)

    if not prices_data or all(df.empty for df in prices_data.values()):
        raise ValueError("Failed to load historical data. Please check tickers or change period.")

    close_prices = pd.DataFrame()
    for ticker, df in prices_data.items():
        if not df.empty:
            if "Adj Close" in df.columns:
                close_prices[ticker] = df["Adj Close"]
            elif "Close" in df.columns:
                close_prices[ticker] = df["Close"]

    returns = PortfolioAnalytics.calculate_returns(close_prices)
    valid_tickers = [t for t in tickers if t in returns.columns]

    if len(valid_tickers) < len(tickers):
        missing_tickers = set(tickers) - set(valid_tickers)
        logger.warning("No data found for the following tickers: %s", missing_tickers)

    if benchmark and benchmark in returns.columns:
        benchmark_returns = returns[benchmark].dropna()
    else:
        if benchmark:
            logger.warning("Benchmark %s is missing from the return data.", benchmark)
        benchmark_returns = pd.Series(dtype=float)

    return close_prices, returns, valid_tickers, benchmark_returns, prices_data


def _json_float(x: Any) -> Optional[float]:
    if x is None:
        return None
    try:
        f = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def metrics_to_json(metrics: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """Convert numpy/pandas scalars in metrics dict to JSON-safe floats."""
    out: Dict[str, Optional[float]] = {}
    for k, v in metrics.items():
        if isinstance(v, (np.floating, np.integer)):
            out[k] = _json_float(v)
        elif isinstance(v, (float, int)):
            out[k] = _json_float(v)
        elif hasattr(v, "item"):
            out[k] = _json_float(v.item())
        else:
            try:
                out[k] = _json_float(float(v))
            except (TypeError, ValueError):
                out[k] = None
    return out


def cumulative_returns_series_pct(portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> List[Dict[str, Any]]:
    """Aligned cumulative return series as percentages for charting."""
    if portfolio_returns.empty:
        return []

    port_cum = (1 + portfolio_returns).cumprod() - 1
    idx = portfolio_returns.index

    bench_aligned = None
    if benchmark_returns is not None and not benchmark_returns.empty:
        common = idx.intersection(benchmark_returns.index)
        if len(common) > 0:
            b = benchmark_returns.loc[common]
            bench_cum = (1 + b).cumprod() - 1
            bench_aligned = bench_cum.reindex(idx).ffill()

    rows: List[Dict[str, Any]] = []
    for dt in idx:
        row: Dict[str, Any] = {
            "date": dt.isoformat() if hasattr(dt, "isoformat") else str(dt),
            "portfolio_pct": _json_float(port_cum.loc[dt] * 100) or 0.0,
        }
        if bench_aligned is not None and dt in bench_aligned.index:
            v = bench_aligned.loc[dt]
            row["benchmark_pct"] = _json_float(v * 100) if v == v else None
        else:
            row["benchmark_pct"] = None
        rows.append(row)
    return rows


def run_portfolio_analysis(
    data_fetcher,
    tickers: List[str],
    weights: Dict[str, float],
    start_date_str: str,
    end_date_str: str,
    benchmark: str,
    risk_free_rate: float,
) -> Dict[str, Any]:
    """
    Load data, compute portfolio returns and benchmark metrics.

    Returns dict with: valid_tickers, missing_tickers, metrics (json), timeseries, error (optional).
    """
    close_prices, returns, valid_tickers, benchmark_returns, _ = load_portfolio_data(
        data_fetcher, tickers, start_date_str, end_date_str, benchmark
    )
    missing = list(set(tickers) - set(valid_tickers))
    w = {t: float(weights.get(t, 0.0)) for t in valid_tickers}
    s = sum(w.values())
    if s > 0:
        w = {t: w[t] / s for t in w}

    portfolio_returns = PortfolioAnalytics.calculate_portfolio_return(returns, w)
    metrics = PortfolioAnalytics.calculate_portfolio_metrics(
        portfolio_returns, benchmark_returns, risk_free_rate=risk_free_rate
    )
    timeseries = cumulative_returns_series_pct(portfolio_returns, benchmark_returns)

    return {
        "valid_tickers": valid_tickers,
        "missing_tickers": missing,
        "metrics": metrics_to_json(metrics),
        "timeseries": timeseries,
    }


def correlation_matrix_for_tickers(
    data_fetcher,
    tickers: List[str],
    start_date_str: str,
    end_date_str: str,
) -> Dict[str, Any]:
    """Pearson correlation of daily returns for tickers."""
    prices_data = data_fetcher.get_batch_data(tickers, start_date_str, end_date_str)
    if not prices_data or all(df.empty for df in prices_data.values()):
        raise ValueError("Failed to load historical data for correlation.")

    close_prices = pd.DataFrame()
    for ticker, df in prices_data.items():
        if not df.empty:
            if "Adj Close" in df.columns:
                close_prices[ticker] = df["Adj Close"]
            elif "Close" in df.columns:
                close_prices[ticker] = df["Close"]

    rets = PortfolioAnalytics.calculate_returns(close_prices)
    if rets.empty or rets.shape[1] < 2:
        raise ValueError("Not enough return data to compute correlation.")

    corr = rets.corr()
    labels = list(corr.columns)
    matrix = corr.values.tolist()
    clean: List[List[Optional[float]]] = []
    for row in matrix:
        clean.append([_json_float(x) for x in row])
    return {"labels": labels, "matrix": clean}
