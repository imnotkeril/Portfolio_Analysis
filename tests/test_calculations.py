import numpy as np
import pandas as pd
import pytest

from src.utils.calculations import PortfolioAnalytics as PA
from src.utils.optimization import PortfolioOptimizer


def _returns(n=300, seed=1):
    rng = np.random.default_rng(seed)
    return pd.Series(rng.normal(0.0005, 0.01, n), index=pd.bdate_range("2023-01-02", periods=n))


def test_calculate_returns_simple():
    prices = pd.DataFrame({"A": [100.0, 110.0, 121.0]})
    r = PA.calculate_returns(prices)
    assert r["A"].iloc[-1] == pytest.approx(0.10)


def test_cumulative_return_matches_compounding():
    r = pd.Series([0.1, -0.05, 0.02])
    cum = PA.calculate_cumulative_returns(r)
    assert cum.iloc[-1] == pytest.approx(1.1 * 0.95 * 1.02 - 1)


def test_max_drawdown_known_series():
    r = pd.Series([0.1, -0.2, 0.05, 0.0, 0.0])  # peak 1.1 -> trough 0.88 : 20% (returned as positive)
    assert PA.calculate_max_drawdown(r) == pytest.approx(0.2, abs=1e-9)


def test_volatility_annualized():
    r = _returns()
    assert PA.calculate_volatility(r) == pytest.approx(r.std() * np.sqrt(252), rel=1e-6)


def test_sharpe_matches_formula_and_var_positive():
    r = _returns()
    expected = r.mean() / r.std() * np.sqrt(252)
    assert PA.calculate_sharpe_ratio(r, 0.0) == pytest.approx(expected, rel=1e-9)
    assert PA.calculate_sharpe_ratio(r + 0.01, 0.0) > 0
    var = PA.calculate_var(r, 0.95)  # loss reported as a positive number
    assert np.isfinite(var) and var > 0


def test_beta_of_series_against_itself_is_one():
    r = _returns()
    assert PA.calculate_beta(r, r) == pytest.approx(1.0)


@pytest.mark.parametrize("method", ["maximum_sharpe", "minimum_variance", "risk_parity", "equal_weight", "markowitz"])
def test_optimizer_weights_valid(method):
    rng = np.random.default_rng(7)
    df = pd.DataFrame(rng.normal(0.0005, 0.01, (300, 3)), columns=["A", "B", "C"])
    res = PortfolioOptimizer.optimize_portfolio(df, method=method, risk_free_rate=0.0)
    w = res["optimal_weights"] if "optimal_weights" in res else res["weights"]
    assert sum(w.values()) == pytest.approx(1.0, abs=1e-6)
    assert all(v >= -1e-9 for v in w.values())
