import io

import pytest

PF = {"name": "t1", "assets": [{"ticker": "AAA", "weight": 0.6}, {"ticker": "BBB", "weight": 0.4}]}


def test_health_public_even_with_api_key(api_client, monkeypatch):
    c, m = api_client
    monkeypatch.setattr(m, "API_KEY", "secret")
    assert c.get("/health").status_code == 200


def test_auth_required_when_key_set(api_client, monkeypatch):
    c, m = api_client
    monkeypatch.setattr(m, "API_KEY", "secret")
    assert c.get("/portfolios").status_code == 401
    assert c.get("/portfolios", headers={"X-API-Key": "wrong"}).status_code == 401
    assert c.get("/portfolios", headers={"X-API-Key": "secret"}).status_code == 200


def test_cors_does_not_reflect_foreign_origin(api_client):
    c, _ = api_client
    r = c.get("/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in r.headers
    r = c.get("/health", headers={"Origin": "http://localhost:3000"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-credentials" not in r.headers


def test_portfolio_crud(api_client):
    c, _ = api_client
    assert c.post("/portfolios", json=PF).status_code == 200
    assert any(p["name"] == "t1" for p in c.get("/portfolios").json())
    assert c.get("/portfolios/t1").json()["name"] == "t1"
    assert c.delete("/portfolios/t1").status_code == 200
    assert c.get("/portfolios/t1").status_code == 404


@pytest.mark.parametrize("pid", ["..%5C..%5Cx", "..%5Csecret", "a%00b", ".."])
def test_portfolio_id_traversal_rejected(api_client, pid):
    c, _ = api_client
    r = c.get(f"/portfolios/{pid}")
    assert r.status_code in (400, 404)
    r = c.delete(f"/portfolios/{pid}")
    assert r.status_code in (400, 404)


def test_404_does_not_leak_absolute_path(api_client):
    c, _ = api_client
    r = c.get("/portfolios/nope")
    assert r.status_code == 404
    assert "/" not in r.json()["detail"] and "\\" not in r.json()["detail"]


def test_csv_upload_size_limit(api_client, monkeypatch):
    c, m = api_client
    monkeypatch.setattr(m, "MAX_UPLOAD_BYTES", 100)
    big = io.BytesIO(b"ticker,weight\n" + b"A,1\n" * 100)
    r = c.post("/portfolios/preview-csv", files={"file": ("a.csv", big, "text/csv")})
    assert r.status_code == 413
    ok = io.BytesIO(b"ticker,weight\nA,1\n")
    r = c.post("/portfolios/preview-csv", files={"file": ("a.csv", ok, "text/csv")})
    assert r.status_code == 200 and r.json()["has_ticker_column"] is True


def test_optimization_missing_portfolio_is_404(api_client):
    c, _ = api_client
    r = c.post("/optimization/run", json={"portfolio_id": "nope", "start": "2023-01-01", "end": "2023-12-31"})
    assert r.status_code == 404


def test_analysis_and_optimization_with_fake_data(api_client):
    c, _ = api_client
    c.post("/portfolios", json=PF)
    body = {"portfolio_id": "t1", "start": "2023-01-01", "end": "2023-12-31", "benchmark": "SPY"}
    r = c.post("/analysis/metrics", json=body)
    assert r.status_code == 200
    assert "sharpe_ratio" in r.json()["metrics"]


@pytest.mark.parametrize("method", ["maximum_sharpe", "minimum_variance", "risk_parity", "equal_weight", "markowitz"])
def test_optimization_every_method_via_api(api_client, method):
    c, _ = api_client
    c.post("/portfolios", json=PF)
    r = c.post("/optimization/run", json={"portfolio_id": "t1", "method": method,
                                          "start": "2023-01-01", "end": "2023-12-31"})
    assert r.status_code == 200, r.text
    w = r.json()["optimal_weights"]
    assert abs(sum(w.values()) - 1.0) < 1e-6


def test_scenario_chain_limits(api_client):
    c, _ = api_client
    key = c.get("/advanced/scenario-starters").json()[0]["key"]
    r = c.post("/advanced/scenario-chain", json={"starting_scenario": key, "num_simulations": 10**7})
    assert r.json()["simulations"] == 5000
    assert c.post("/advanced/scenario-chain", json={"starting_scenario": "zzz"}).status_code == 400
