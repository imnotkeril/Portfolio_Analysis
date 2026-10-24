# Plan — Portfolio Analysis

Legend: `[ ]` open · `[x]` done · `[!]` blocked.

- [x] T01 Commit untracked work. check: `git status --short` empty
- [ ] T02 API hardening: API-key auth (opt-in via `API_KEY`), CORS from `CORS_ORIGINS` (no `*`+credentials), CSV size limit, portfolio_id sanitization, no absolute paths in errors, optimization 500→404. check: pytest tests/test_api.py
- [ ] T03 Docker: non-root users, ports bound to 127.0.0.1, env passthrough. check: docker compose build + live smoke
- [ ] T04 Frontend: bump next/postcss/sharp/nanoid; proxy forwards API key. check: `npm audit --omit=dev`, `npx tsc --noEmit`, `npm run build`
- [ ] T05 Tests: core calculations + API. check: pytest
- [ ] T06 Deps: pin Python deps (requirements.txt pinned, trimmed), pip-audit. check: pip-audit
- [ ] T07 Cleanup: remove run.py duplicate, LICENSE.txt duplicate, README (license, Python 3.10+, env vars, tests). check: manual
- [ ] T08 Final verify in Docker, update audit "After fixes"
