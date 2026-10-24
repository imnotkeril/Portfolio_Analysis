"""
Portfolio creation flows for API (mirrors Streamlit portfolio_creation logic).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from src.portfolio_templates import get_template


def apply_template_and_save(
    portfolio_manager,
    data_fetcher,
    template_id: str,
    name: str,
    description: str,
) -> Tuple[Dict[str, Any], str, List[str]]:
    template = get_template(template_id)
    tickers = [a["ticker"] for a in template["assets"]]
    valid, invalid = data_fetcher.validate_tickers(tickers)
    assets = [a.copy() for a in template["assets"] if a["ticker"] in valid]
    if not assets:
        raise ValueError("No valid tickers left after validation; check market data access.")
    portfolio_data: Dict[str, Any] = {
        "name": name,
        "description": description or template.get("description", ""),
        "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "assets": assets,
    }
    if invalid:
        total_w = sum(a["weight"] for a in portfolio_data["assets"])
        if total_w > 0:
            for a in portfolio_data["assets"]:
                a["weight"] = float(a["weight"]) / total_w
    portfolio_manager._enrich_portfolio_data(portfolio_data)
    path = portfolio_manager.save_portfolio(portfolio_data)
    return portfolio_data, path, invalid


def create_from_assets_and_save(
    portfolio_manager,
    data_fetcher,
    name: str,
    description: str,
    assets: List[Dict[str, Any]],
    extra_fields: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], str, List[str]]:
    norm_assets: List[Dict[str, Any]] = []
    for a in assets:
        t = str(a.get("ticker", "")).strip().upper()
        if not t:
            continue
        norm_assets.append({"ticker": t, "weight": float(a.get("weight", 0) or 0)})

    if not norm_assets:
        raise ValueError("No assets provided")

    portfolio_data: Dict[str, Any] = {
        "name": name,
        "description": description or "",
        "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "assets": norm_assets,
    }
    if extra_fields:
        for k, v in extra_fields.items():
            if v is not None:
                portfolio_data[k] = v
    portfolio_manager._normalize_weights(portfolio_data)
    tickers = [a["ticker"] for a in portfolio_data["assets"]]
    valid, invalid = data_fetcher.validate_tickers(tickers)
    if invalid:
        portfolio_data["assets"] = [a for a in portfolio_data["assets"] if a["ticker"] in valid]
        portfolio_manager._normalize_weights(portfolio_data)
    if not portfolio_data["assets"]:
        raise ValueError("All tickers failed validation")
    portfolio_manager._enrich_portfolio_data(portfolio_data)
    path = portfolio_manager.save_portfolio(portfolio_data)
    return portfolio_data, path, invalid
