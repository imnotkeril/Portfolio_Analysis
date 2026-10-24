"""
FastAPI backend for Portfolio Analysis (headless layer over src.utils).
Run from repo root: uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import io
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Repo root on sys.path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import src.config as config
from src.portfolio_templates import PORTFOLIO_TEMPLATES, list_template_summaries
from src.utils.data_fetcher import DataFetcher, PortfolioDataManager
from src.services.analysis_service import (
    correlation_matrix_for_tickers,
    run_portfolio_analysis,
)
from src.services.optimization_service import run_optimization
from src.services.portfolio_creation_service import (
    apply_template_and_save,
    create_from_assets_and_save,
)
from src.utils.scenario_chaining import scenario_chains, simulate_scenario_chain
from src.utils.historical_context import historical_crisis_context

data_fetcher = DataFetcher(cache_dir=str(config.CACHE_DIR), cache_expiry_days=config.CACHE_EXPIRY_DAYS)
if config.ALPHA_VANTAGE_API_KEY:
    data_fetcher.api_keys["alpha_vantage"] = config.ALPHA_VANTAGE_API_KEY

portfolio_manager = PortfolioDataManager(data_fetcher, storage_dir=str(config.PORTFOLIO_DIR))

app = FastAPI(title="Portfolio Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortfolioAsset(BaseModel):
    ticker: str
    weight: float
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    currency: Optional[str] = None
    asset_class: Optional[str] = None
    current_price: Optional[float] = None
    price_date: Optional[str] = None


class PortfolioPayload(BaseModel):
    name: str
    description: Optional[str] = ""
    assets: List[PortfolioAsset]
    tags: Optional[List[str]] = None


class AnalysisRequest(BaseModel):
    portfolio_id: Optional[str] = None
    tickers: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    start: str = Field(..., description="YYYY-MM-DD")
    end: str = Field(..., description="YYYY-MM-DD")
    benchmark: str = "SPY"
    risk_free_rate: float = 0.0


class TimeseriesRequest(BaseModel):
    portfolio_id: Optional[str] = None
    tickers: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    start: str
    end: str
    benchmark: str = "SPY"
    risk_free_rate: float = 0.0


class CorrelationRequest(BaseModel):
    tickers: List[str]
    start: str
    end: str


class OptimizationRequest(BaseModel):
    portfolio_id: Optional[str] = None
    tickers: Optional[List[str]] = None
    method: str = "maximum_sharpe"
    start: str
    end: str
    risk_free_rate: float = 0.0
    min_weight: float = 0.0
    max_weight: float = 1.0
    target_return: Optional[float] = None


class ScenarioChainRequest(BaseModel):
    starting_scenario: str
    num_simulations: int = 500


class TickersValidateRequest(BaseModel):
    tickers: List[str]


class ParseTextRequest(BaseModel):
    text: str


class CreateFromTextRequest(BaseModel):
    text: str
    name: str
    description: str = ""


class AssetWeightInput(BaseModel):
    ticker: str
    weight: float


class CreateFromAssetsRequest(BaseModel):
    name: str
    description: str = ""
    assets: List[AssetWeightInput]
    base_currency: Optional[str] = None
    initial_investment: Optional[float] = None
    portfolio_mode: Optional[str] = None
    creation_method: Optional[str] = None


class FromTemplateRequest(BaseModel):
    template_id: str
    name: str
    description: str = ""


class DuplicatePortfolioRequest(BaseModel):
    new_name: str


def _sanitize_stem(name: str) -> str:
    s = re.sub(r"[^\w\s-]", "", name).strip()
    s = re.sub(r"[-\s]+", "_", s)
    return s or "portfolio"


def _portfolio_name_exists(name: str) -> bool:
    return any(p.get("name") == name for p in portfolio_manager.list_portfolios())


def _resolve_universe(body: AnalysisRequest | TimeseriesRequest) -> tuple[List[str], Dict[str, float]]:
    if body.portfolio_id:
        data = portfolio_manager.load_portfolio(body.portfolio_id)
        tickers = [a["ticker"] for a in data["assets"]]
        weights = {a["ticker"]: float(a["weight"]) for a in data["assets"]}
        return tickers, weights
    if body.tickers and body.weights:
        return list(body.tickers), dict(body.weights)
    raise HTTPException(status_code=400, detail="Provide portfolio_id or tickers+weights")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/portfolios")
def list_portfolios() -> List[Dict[str, Any]]:
    return portfolio_manager.list_portfolios()


@app.get("/portfolios/templates")
def list_portfolio_templates() -> List[Dict[str, Any]]:
    return list_template_summaries()


@app.get("/portfolios/templates/{template_id}")
def get_portfolio_template(template_id: str) -> Dict[str, Any]:
    if template_id not in PORTFOLIO_TEMPLATES:
        raise HTTPException(status_code=404, detail="Unknown template_id")
    return PORTFOLIO_TEMPLATES[template_id]


@app.post("/tickers/validate")
def tickers_validate(body: TickersValidateRequest) -> Dict[str, Any]:
    valid, invalid = data_fetcher.validate_tickers([t.strip().upper() for t in body.tickers if t.strip()])
    return {"valid_tickers": valid, "invalid_tickers": invalid}


@app.get("/tickers/search")
def tickers_search(q: str, limit: int = 10) -> List[Dict[str, Any]]:
    if not q or not q.strip():
        return []
    raw = q.strip()
    cap = min(limit, 25)
    out = list(data_fetcher.search_tickers(raw, limit=cap))
    sym = re.sub(r"\s+", "", raw).upper()
    if sym and re.fullmatch(r"[A-Z0-9.\-]{1,12}", sym):
        valid, _invalid = data_fetcher.validate_tickers([sym])
        if sym in valid:
            def _sym_key(r: Dict[str, Any]) -> str:
                return str(r.get("symbol") or r.get("Symbol") or "").replace(".", "-").upper()

            if not any(_sym_key(r) == sym.replace(".", "-") for r in out):
                info = data_fetcher.get_company_info(sym) or {}
                out.insert(
                    0,
                    {
                        "symbol": sym,
                        "name": info.get("name", sym),
                        "type": info.get("type", "Equity"),
                        "region": info.get("country", "US"),
                        "currency": info.get("currency", "USD"),
                    },
                )
    return out[:cap]


@app.post("/portfolios/parse-text")
def portfolios_parse_text(body: ParseTextRequest) -> Dict[str, Any]:
    assets = portfolio_manager.parse_ticker_weights_text(body.text)
    return {"assets": assets}


@app.post("/portfolios/check-text")
def portfolios_check_text(body: ParseTextRequest) -> Dict[str, Any]:
    assets = portfolio_manager.parse_ticker_weights_text(body.text)
    if not assets:
        return {"assets": [], "valid_tickers": [], "invalid_tickers": [], "rows": []}
    tickers = [a["ticker"] for a in assets]
    valid, invalid = data_fetcher.validate_tickers(tickers)
    rows = [
        {
            "ticker": a["ticker"],
            "weight": a["weight"],
            "found": a["ticker"] in valid,
        }
        for a in assets
    ]
    return {
        "assets": assets,
        "valid_tickers": valid,
        "invalid_tickers": invalid,
        "rows": rows,
    }


@app.post("/portfolios/create-from-text")
def portfolios_create_from_text(body: CreateFromTextRequest) -> Dict[str, Any]:
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Portfolio name is required")
    if _portfolio_name_exists(body.name.strip()):
        raise HTTPException(
            status_code=409,
            detail=f"A portfolio named '{body.name}' already exists. Choose another name or delete it in management.",
        )
    try:
        portfolio = portfolio_manager.create_portfolio_from_text(
            body.text, body.name.strip(), body.description or ""
        )
        path = portfolio_manager.save_portfolio(portfolio)
        return jsonable_encoder({"saved": True, "path": path, "portfolio": portfolio})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/portfolios/create-from-assets")
def portfolios_create_from_assets(body: CreateFromAssetsRequest) -> Dict[str, Any]:
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Portfolio name is required")
    if _portfolio_name_exists(body.name.strip()):
        raise HTTPException(status_code=409, detail="A portfolio with this name already exists")
    try:
        assets_in = [a.model_dump() for a in body.assets]
        extra: Dict[str, Any] = {}
        if body.base_currency is not None:
            extra["base_currency"] = body.base_currency
        if body.initial_investment is not None:
            extra["initial_investment"] = body.initial_investment
        if body.portfolio_mode is not None:
            extra["portfolio_mode"] = body.portfolio_mode
        if body.creation_method is not None:
            extra["creation_method"] = body.creation_method
        portfolio, path, invalid = create_from_assets_and_save(
            portfolio_manager,
            data_fetcher,
            body.name.strip(),
            body.description or "",
            assets_in,
            extra_fields=extra or None,
        )
        return jsonable_encoder(
            {"saved": True, "path": path, "portfolio": portfolio, "invalid_tickers": invalid}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/portfolios/from-template")
def portfolios_from_template(body: FromTemplateRequest) -> Dict[str, Any]:
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Portfolio name is required")
    if _portfolio_name_exists(body.name.strip()):
        raise HTTPException(status_code=409, detail="A portfolio with this name already exists")
    try:
        portfolio, path, invalid = apply_template_and_save(
            portfolio_manager,
            data_fetcher,
            body.template_id,
            body.name.strip(),
            body.description or "",
        )
        return jsonable_encoder(
            {"saved": True, "path": path, "portfolio": portfolio, "invalid_tickers": invalid}
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown template_id") from None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/portfolios/preview-csv")
async def portfolios_preview_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}") from e
    cols = list(df.columns)
    has_ticker = "ticker" in cols
    preview = df.head(10).to_dict(orient="records")
    return {"columns": cols, "has_ticker_column": has_ticker, "preview": jsonable_encoder(preview)}


@app.post("/portfolios/import-csv")
async def portfolios_import_csv(
    portfolio_name: str = Form(...),
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    if not portfolio_name.strip():
        raise HTTPException(status_code=400, detail="Portfolio name is required")
    if _portfolio_name_exists(portfolio_name.strip()):
        raise HTTPException(status_code=409, detail="A portfolio with this name already exists")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")
    raw = await file.read()
    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            tmp.write(raw)
            tmp_path = tmp.name
        portfolio = portfolio_manager.import_from_csv(tmp_path, portfolio_name.strip())
        portfolio_manager.save_portfolio(portfolio)
        return jsonable_encoder({"saved": True, "portfolio": portfolio})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    finally:
        if tmp_path:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except OSError:
                pass


@app.get("/portfolios/{portfolio_id}/export-csv")
def portfolios_export_csv(portfolio_id: str) -> FileResponse:
    try:
        pdata = portfolio_manager.load_portfolio(portfolio_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    try:
        out_path = portfolio_manager.export_to_csv(pdata)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    fname = f"{_sanitize_stem(pdata['name'])}.csv"
    return FileResponse(out_path, filename=fname, media_type="text/csv")


@app.post("/portfolios/{portfolio_id}/duplicate")
def portfolios_duplicate(portfolio_id: str, body: DuplicatePortfolioRequest) -> Dict[str, Any]:
    if not body.new_name.strip():
        raise HTTPException(status_code=400, detail="new_name is required")
    if _portfolio_name_exists(body.new_name.strip()):
        raise HTTPException(status_code=409, detail="A portfolio with this name already exists")
    try:
        pdata = portfolio_manager.load_portfolio(portfolio_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    pdata["name"] = body.new_name.strip()
    pdata["created"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    pdata["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    path = portfolio_manager.save_portfolio(pdata)
    return {"saved": True, "path": path, "portfolio": jsonable_encoder(pdata)}


@app.get("/portfolios/{portfolio_id}")
def get_portfolio(portfolio_id: str) -> Dict[str, Any]:
    try:
        return portfolio_manager.load_portfolio(portfolio_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@app.post("/portfolios")
def create_portfolio(payload: PortfolioPayload) -> Dict[str, Any]:
    data = payload.model_dump()
    path = portfolio_manager.save_portfolio(data)
    return {"saved": True, "path": path}


@app.put("/portfolios/{portfolio_id}")
def update_portfolio(portfolio_id: str, payload: PortfolioPayload) -> Dict[str, Any]:
    data = payload.model_dump()
    stem = _sanitize_stem(portfolio_id)
    path = portfolio_manager.save_portfolio(data, filename=stem)
    return {"saved": True, "path": path}


@app.delete("/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: str) -> Dict[str, bool]:
    ok = portfolio_manager.delete_portfolio(portfolio_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"deleted": True}


@app.post("/analysis/metrics")
def analysis_metrics(body: AnalysisRequest) -> Dict[str, Any]:
    tickers, weights = _resolve_universe(body)
    if not tickers:
        raise HTTPException(status_code=400, detail="No tickers")
    try:
        out = run_portfolio_analysis(
            data_fetcher,
            tickers,
            weights,
            body.start,
            body.end,
            body.benchmark,
            body.risk_free_rate,
        )
        return jsonable_encoder(out)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/analysis/timeseries")
def analysis_timeseries(body: TimeseriesRequest) -> Dict[str, Any]:
    tickers, weights = _resolve_universe(body)
    if not tickers:
        raise HTTPException(status_code=400, detail="No tickers")
    try:
        out = run_portfolio_analysis(
            data_fetcher,
            tickers,
            weights,
            body.start,
            body.end,
            body.benchmark,
            body.risk_free_rate,
        )
        return jsonable_encoder(
            {
                "valid_tickers": out["valid_tickers"],
                "missing_tickers": out["missing_tickers"],
                "timeseries": out["timeseries"],
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/analysis/correlation")
def analysis_correlation(body: CorrelationRequest) -> Dict[str, Any]:
    if len(body.tickers) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tickers")
    try:
        return jsonable_encoder(
            correlation_matrix_for_tickers(data_fetcher, body.tickers, body.start, body.end)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/optimization/run")
def optimization_run(body: OptimizationRequest) -> Dict[str, Any]:
    if body.portfolio_id:
        pdata = portfolio_manager.load_portfolio(body.portfolio_id)
        tickers = [a["ticker"] for a in pdata["assets"]]
    elif body.tickers:
        tickers = list(body.tickers)
    else:
        raise HTTPException(status_code=400, detail="Provide portfolio_id or tickers")

    if not tickers:
        raise HTTPException(status_code=400, detail="No tickers")

    try:
        result = run_optimization(
            data_fetcher,
            tickers,
            body.method,
            body.start,
            body.end,
            risk_free_rate=body.risk_free_rate,
            min_weight=body.min_weight,
            max_weight=body.max_weight,
            target_return=body.target_return,
        )
        return jsonable_encoder(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.get("/advanced/historical-crises")
def list_historical_crises() -> List[Dict[str, str]]:
    return [{"key": k, "name": v.get("name", k)} for k, v in historical_crisis_context.items()]


@app.get("/advanced/historical-crises/{crisis_key}")
def get_historical_crisis(crisis_key: str) -> Dict[str, Any]:
    if crisis_key not in historical_crisis_context:
        raise HTTPException(status_code=404, detail="Unknown crisis key")
    return historical_crisis_context[crisis_key]


@app.get("/advanced/scenario-starters")
def list_scenario_starters() -> List[Dict[str, str]]:
    return [{"key": k, "name": v["name"]} for k, v in scenario_chains.items()]


@app.post("/advanced/scenario-chain")
def scenario_chain(body: ScenarioChainRequest) -> Dict[str, Any]:
    if body.starting_scenario not in scenario_chains:
        raise HTTPException(status_code=400, detail="Unknown starting_scenario")
    n = max(1, min(body.num_simulations, 5000))
    raw = simulate_scenario_chain(body.starting_scenario, num_simulations=n)
    transitions: Dict[str, int] = {}
    for result in raw:
        chain = result["chain"]
        for i in range(len(chain) - 1):
            key = f"{chain[i]}->{chain[i+1]}"
            transitions[key] = transitions.get(key, 0) + 1
    sample = raw[: min(100, len(raw))]
    return jsonable_encoder(
        {
            "simulations": n,
            "transition_counts": transitions,
            "sample_chains": sample,
        }
    )


@app.post("/cache/clear")
def clear_cache() -> Dict[str, str]:
    data_fetcher.clear_cache()
    return {"status": "cleared"}
