"""
Built-in portfolio templates (shared by Streamlit and API).
"""
from typing import Any, Dict, List

# Keys are stable IDs for API; Streamlit displays title + description.
PORTFOLIO_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "sp500_top_10": {
        "title": "S&P 500 Top 10",
        "description": "The 10 Largest Companies in the S&P 500 Index",
        "assets": [
            {"ticker": "AAPL", "weight": 0.20, "name": "Apple Inc.", "sector": "Technology"},
            {"ticker": "MSFT", "weight": 0.18, "name": "Microsoft Corporation", "sector": "Technology"},
            {"ticker": "AMZN", "weight": 0.12, "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
            {"ticker": "NVDA", "weight": 0.10, "name": "NVIDIA Corporation", "sector": "Technology"},
            {"ticker": "GOOGL", "weight": 0.09, "name": "Alphabet Inc. Class A", "sector": "Communication Services"},
            {"ticker": "META", "weight": 0.08, "name": "Meta Platforms Inc.", "sector": "Communication Services"},
            {"ticker": "GOOG", "weight": 0.07, "name": "Alphabet Inc. Class C", "sector": "Communication Services"},
            {"ticker": "BRK.B", "weight": 0.06, "name": "Berkshire Hathaway Inc. Class B", "sector": "Financials"},
            {"ticker": "TSLA", "weight": 0.05, "name": "Tesla, Inc.", "sector": "Consumer Discretionary"},
            {"ticker": "UNH", "weight": 0.05, "name": "UnitedHealth Group Incorporated", "sector": "Healthcare"},
        ],
    },
    "classic_60_40": {
        "title": "Classic 60/40",
        "description": "Classic allocation: 60% stocks, 40% bonds",
        "assets": [
            {"ticker": "VOO", "weight": 0.40, "name": "Vanguard S&P 500 ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "VEA", "weight": 0.20, "name": "Vanguard FTSE Developed Markets ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "BND", "weight": 0.30, "name": "Vanguard Total Bond Market ETF", "sector": "Fixed Income", "asset_class": "ETF"},
            {"ticker": "BNDX", "weight": 0.10, "name": "Vanguard Total International Bond ETF", "sector": "Fixed Income", "asset_class": "ETF"},
        ],
    },
    "equal_risk_buckets": {
        "title": "Portfolio of constant weights",
        "description": "Even distribution between asset classes",
        "assets": [
            {"ticker": "VTI", "weight": 0.25, "name": "Vanguard Total Stock Market ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "TLT", "weight": 0.25, "name": "iShares 20+ Year Treasury Bond ETF", "sector": "Fixed Income", "asset_class": "ETF"},
            {"ticker": "GLD", "weight": 0.25, "name": "SPDR Gold Shares", "sector": "Commodities", "asset_class": "ETF"},
            {"ticker": "IEF", "weight": 0.25, "name": "iShares 7-10 Year Treasury Bond ETF", "sector": "Fixed Income", "asset_class": "ETF"},
        ],
    },
    "dividend": {
        "title": "Dividend portfolio",
        "description": "A portfolio focused on stable dividends",
        "assets": [
            {"ticker": "VYM", "weight": 0.20, "name": "Vanguard High Dividend Yield ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "SCHD", "weight": 0.20, "name": "Schwab US Dividend Equity ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "PG", "weight": 0.10, "name": "Procter & Gamble Co", "sector": "Consumer Staples"},
            {"ticker": "JNJ", "weight": 0.10, "name": "Johnson & Johnson", "sector": "Healthcare"},
            {"ticker": "KO", "weight": 0.10, "name": "Coca-Cola Co", "sector": "Consumer Staples"},
            {"ticker": "PEP", "weight": 0.10, "name": "PepsiCo, Inc.", "sector": "Consumer Staples"},
            {"ticker": "MCD", "weight": 0.10, "name": "McDonald's Corp", "sector": "Consumer Discretionary"},
            {"ticker": "MMM", "weight": 0.10, "name": "3M Co", "sector": "Industrials"},
        ],
    },
    "technology": {
        "title": "Technology portfolio",
        "description": "Portfolio focused on the technology sector",
        "assets": [
            {"ticker": "AAPL", "weight": 0.15, "name": "Apple Inc.", "sector": "Technology"},
            {"ticker": "MSFT", "weight": 0.15, "name": "Microsoft Corporation", "sector": "Technology"},
            {"ticker": "AMZN", "weight": 0.10, "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
            {"ticker": "NVDA", "weight": 0.10, "name": "NVIDIA Corporation", "sector": "Technology"},
            {"ticker": "GOOGL", "weight": 0.10, "name": "Alphabet Inc. Class A", "sector": "Communication Services"},
            {"ticker": "META", "weight": 0.10, "name": "Meta Platforms Inc.", "sector": "Communication Services"},
            {"ticker": "TSLA", "weight": 0.10, "name": "Tesla, Inc.", "sector": "Consumer Discretionary"},
            {"ticker": "ADBE", "weight": 0.07, "name": "Adobe Inc.", "sector": "Technology"},
            {"ticker": "CRM", "weight": 0.07, "name": "Salesforce, Inc.", "sector": "Technology"},
            {"ticker": "PYPL", "weight": 0.06, "name": "PayPal Holdings, Inc.", "sector": "Financials"},
        ],
    },
    "value_factor": {
        "title": "Value Factor",
        "description": "Undervalued companies with low P/E and P/B ratios.",
        "tags": ["Value", "Undervalued", "P/E < 15"],
        "assets": [
            {"ticker": "VTV", "weight": 0.30, "name": "Vanguard Value ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "IWD", "weight": 0.25, "name": "iShares Russell 1000 Value ETF", "sector": "Equities", "asset_class": "ETF"},
            {"ticker": "BRK-B", "weight": 0.15, "name": "Berkshire Hathaway Inc. Class B", "sector": "Financials"},
            {"ticker": "JPM", "weight": 0.10, "name": "JPMorgan Chase & Co.", "sector": "Financials"},
            {"ticker": "WMT", "weight": 0.08, "name": "Walmart Inc.", "sector": "Consumer Staples"},
            {"ticker": "CVX", "weight": 0.07, "name": "Chevron Corporation", "sector": "Energy"},
            {"ticker": "XOM", "weight": 0.05, "name": "Exxon Mobil Corporation", "sector": "Energy"},
        ],
    },
}


def list_template_summaries() -> List[Dict[str, Any]]:
    return [
        {"id": tid, "title": data["title"], "description": data["description"], "asset_count": len(data["assets"])}
        for tid, data in PORTFOLIO_TEMPLATES.items()
    ]


def get_template(template_id: str) -> Dict[str, Any]:
    if template_id not in PORTFOLIO_TEMPLATES:
        raise KeyError(f"Unknown template: {template_id}")
    return PORTFOLIO_TEMPLATES[template_id]
