import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


class FakeFetcher:
    """Offline stand-in for DataFetcher: deterministic random-walk prices."""

    api_keys: dict = {}

    def get_batch_data(self, tickers, start, end):
        idx = pd.bdate_range(start, end)
        out = {}
        for i, t in enumerate(tickers):
            rng = np.random.default_rng(100 + i)
            px = 100 * np.cumprod(1 + rng.normal(0.0004, 0.01, len(idx)))
            out[t] = pd.DataFrame({"Close": px, "Adj Close": px}, index=idx)
        return out

    def validate_tickers(self, tickers):
        return list(tickers), []

    def clear_cache(self):
        pass


@pytest.fixture()
def api_client(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient

    import api.main as m

    monkeypatch.setattr(m.portfolio_manager, "storage_dir", tmp_path)
    monkeypatch.setattr(m, "data_fetcher", FakeFetcher())
    monkeypatch.setattr(m, "API_KEY", "")
    return TestClient(m.app), m
