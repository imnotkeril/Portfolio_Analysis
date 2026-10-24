# Portfolio Analysis

Portfolio analytics/optimization app: FastAPI backend over `src/utils`, Next.js UI, legacy Streamlit UI, Docker Compose.

- Router: finance/portfolio-risk
- Modules: none
- Stack: Python 3.12 (pandas, scipy, yfinance, FastAPI), Next.js 15 (React 19, Tailwind 4, Recharts), Streamlit (legacy)
- Services: yfinance (no key), Alpha Vantage (optional key `ALPHA_VANTAGE_API_KEY`)
- Progress: `docs/STATE.md` · Plan: `docs/plan.md` · Audit: `docs/AUDIT_2026-10-24.md`

## Commands
- API tests: `.venv/Scripts/python.exe -m pytest tests -q` (host matplotlib DLL may be blocked by Windows App Control; then run in Docker: `docker run --rm -v <repo>:/app -w /app <api-image> sh -c "pip install pytest httpx && pytest tests -q"`)
- Frontend: `cd frontend && npm ci && npx tsc --noEmit && npm run build`
- Run all: `docker compose up --build` (UI :3000, API :8000)

## Working rules
- Progress lives in `docs/STATE.md`; resume from "Next".
- Before each step/task: `node E:/Main/Dev/coding-brain/scripts/step-brief.mjs --project . --step <step>` / `--task <id>`.
- After each task: check → tick `docs/plan.md` → one line in `docs/STATE.md` → local commit on `chore/audit`.
- No push / deploy / prod changes without the user's explicit yes. Never read or commit `.env*` / `env`.
