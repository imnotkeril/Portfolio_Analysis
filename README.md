# Portfolio Analysis System

An advanced interactive web application for creating, managing, analyzing, and optimizing investment portfolios with comprehensive analytics and risk management capabilities.

[Streamlit APP](https://wm-portfolio-analysis.streamlit.app/)

## Overview

This system provides a comprehensive solution for portfolio management, allowing investors to create, analyze, and optimize their investment portfolios using advanced financial models and analytical tools. The application combines modern portfolio theory with real-time data, interactive visualizations, and machine learning approaches to deliver actionable insights.

## Images

![Image](https://github.com/user-attachments/assets/f4d778ef-dde2-4d8f-bf79-1c64833763e7)

![Image](https://github.com/user-attachments/assets/14292e28-834f-4c24-acae-04701e87f3ae)

![Image](https://github.com/user-attachments/assets/82a062cd-b095-4ab6-8b1e-a29a146ab0b2)

![Image](https://github.com/user-attachments/assets/fc86fd6c-eebb-42d9-94b9-7c6516af7d1d)

## Key Features

### Portfolio Creation and Management
- Create and save multiple investment portfolios
- Add assets through manual entry, CSV import, or text list input
- Access comprehensive asset information (company details, sectors, financial metrics)
- Portfolio templates and duplication capabilities
- Custom tagging and categorization

### Performance Analytics
- Calculate key financial metrics:
  - Returns (CAGR, absolute, annual, period-specific)
  - Volatility at different time intervals
  - Risk-adjusted metrics (Sharpe, Sortino, Calmar, Information Ratio)
  - Alpha/Beta relative to benchmarks
  - Maximum drawdown and recovery analysis
- Historical performance tracking with benchmark comparison
- Sector, regional, and asset class breakdowns
- Customizable time period analysis

### Risk Management
- Advanced risk measurement:
  - Value at Risk (VaR) using parametric, historical, and Monte Carlo methods
  - Conditional VaR (Expected Shortfall)
  - Stress testing under various market scenarios
  - Drawdown analysis and recovery projections
- Diversification assessment and correlation analysis
- Volatility and risk contribution breakdown
- Sector concentration risk analysis

### Portfolio Optimization
- Multiple optimization methodologies:
  - Markowitz Mean-Variance Optimization
  - Maximum Sharpe Ratio
  - Minimum Variance
  - Risk Parity
  - Equal Weight
- Efficient frontier visualization and optimal portfolio selection
- Custom constraints and objective functions
- Rebalancing recommendations

### Advanced Analysis
- Stress scenario modeling with historical analogies
- Monte Carlo simulation for future projections
- Scenario chaining for complex market events
- Rolling metrics for time-varying performance analysis
- Seasonal patterns and calendar-based analytics

### Interactive Visualizations
- Performance charts (cumulative returns, drawdowns, volatility)
- Risk heatmaps and correlation matrices
- Asset allocation breakdowns
- Historical scenario comparison
- Interactive risk-return scatter plots

## Project Structure

```
├── src/
│   ├── main.py                   # Streamlit entry
│   ├── config.py
│   ├── services/                 # Headless logic (API + shared with Streamlit)
│   │   ├── analysis_service.py
│   │   └── optimization_service.py
│   ├── utils/                    # Calculations, data, risk, optimization, viz
│   ├── pages/                    # Streamlit pages
│   └── data/                     # cache/, portfolios/ (JSON)
├── api/
│   └── main.py                   # FastAPI app
├── frontend/                     # Next.js (Wild Market–styled UI)
├── Dockerfile.api
├── Dockerfile.web
├── docker-compose.yml
├── run_app.py                    # Launches Streamlit from repo root
├── requirements.txt
└── setup.py
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/imnotkeril/Investment-Portfolio-Management-System.git
   cd Investment-Portfolio-Management-System
   ```

2. Create a virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On macOS/Linux
   ```

3. Install as a development package:
   ```
   pip install -e .
   ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Streamlit (legacy UI)

From the repository root (with dependencies installed):

```
python run_app.py
```

or:

```
streamlit run src/main.py
```

Open http://localhost:8501

### Next.js + FastAPI (recommended)

Terminal 1 — API:

```
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 — web (from `frontend/`):

```
cd frontend
copy .env.example .env.local   # optional; default API is http://localhost:8000
npm install
npm run dev
```

Open http://localhost:3000

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if the API is not on port 8000.

### Docker (one command)

```
docker compose up --build
```

Then open http://localhost:3000 (UI) and http://localhost:8000/docs (OpenAPI). Portfolios and cache persist under `./src/data` via a volume.

Windows shortcut: double-click `start-docker.bat` from the project folder.

Ports are bound to `127.0.0.1` only. Optional settings go in a `.env` file next to `docker-compose.yml` (see `.env.example`):

- `ALPHA_VANTAGE_API_KEY` - extra market data (optional)
- `API_KEY` - if set, the API requires an `X-API-Key` header (the web container forwards it server-side). Set it before exposing anything beyond localhost, and put a TLS reverse proxy in front.
- `CORS_ORIGINS` - comma-separated allowed browser origins (default: localhost:3000)
- `MAX_UPLOAD_BYTES` - CSV upload limit (default 2 MB)

The containers run as a non-root user (uid 1000); on Linux make `./src/data` writable for that uid.

## Getting Started Guide

### 1. Create Your First Portfolio

Start by navigating to the "Create Portfolio" section where you can:
- Enter tickers manually with automatic validation
- Import from a CSV file with predefined format
- Use a template portfolio as a starting point
- Paste a list of tickers with weights

The system will automatically fetch additional information about each asset including sector, market cap, and other fundamental data.

### 2. Analyze Your Portfolio

In the "Portfolio Analysis" section, you can:
- View key performance metrics including returns, volatility, and risk-adjusted measures
- Compare your portfolio against benchmarks like S&P 500, NASDAQ, or custom indices
- Analyze portfolio composition by sector, asset class, and other dimensions
- Explore detailed risk metrics including VaR, drawdowns, and stress test results
- Examine correlations between assets and identify diversification opportunities

The analysis section provides various tabs that allow you to dive deep into different aspects of performance, risk, correlation, and stress testing.

### 3. Optimize Your Portfolio

The "Portfolio Optimization" section offers tools to:
- Generate an efficient frontier to visualize risk-return tradeoffs
- Optimize for maximum Sharpe ratio, minimum variance, or specific return targets
- Apply risk parity approaches for balanced risk allocation
- Set constraints on sector exposure, individual asset weights, or other parameters
- Compare optimization results against your current portfolio

### 4. Explore Advanced Features

Additional specialized capabilities include:
- "Stress Scenario Chains" to model complex market events and their cascading effects
- "Historical Analogies" to compare current market conditions with past scenarios
- Rolling metrics analysis to see how performance evolves over time
- Seasonal patterns and calendar effects on portfolio performance

## Development

### Prerequisites
- Python 3.10 or higher (Docker image uses 3.12)
- Knowledge of pandas, numpy, and financial concepts
- API key for Alpha Vantage (optional for enhanced data access)

### Tests

```
pip install -r requirements-dev.txt
python -m pytest tests -q
```

Tests are offline (synthetic prices, temporary portfolio storage).

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License

Released under the MIT License (see `LICENSE`).

## Acknowledgments

- Built with Streamlit, pandas, numpy, plotly, and other open-source libraries
- Financial data provided by Yahoo Finance and Alpha Vantage
- Portfolio optimization algorithms based on modern portfolio theory
- Risk management techniques from financial industry practices

---

For questions or support, please open an issue on the GitHub repository.
