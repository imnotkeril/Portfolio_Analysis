# STATE — Portfolio Analysis

Append-only log. Resume from "Next" and `docs/plan.md`.

## Log
- [x] audit — docs/AUDIT_2026-10-24.md
- [x] T01 commit previously untracked code (api, frontend, services, docker) — git status clean, 3 commits
- [x] adopt — CLAUDE.md, STATE, plan; router finance/portfolio-risk (apply-router linked skills into .claude/, gitignored)
- [x] T02 API hardening (auth via API_KEY, CORS allowlist, 2MB upload limit, id sanitization, no path leaks, 404) — 29 pytest passed in Docker
- [x] T04 next 15.5.28 + postcss override — npm audit --omit=dev 0 vulns, tsc/eslint/build OK
- [x] T05 tests (tests/: calculations, optimizer, API) — 29 passed; found+fixed equal_weight 500 bug
- [x] T06 pinned direct Python deps (requirements.txt, requirements-dev.txt) — verified in Docker 3.12
- [x] T07 cleanup (run.py, LICENSE.txt removed; README license MIT, py3.10, env vars, tests)
- [x] T03 Docker verified live: first exit(1) was a stale image built before a NUL-byte fix in data_fetcher.py (not a non-root issue). After rebuild: api/web uid 1000, no-key 401, key 200, /health 200, UI+proxy 200, evil-origin CORS none, missing portfolio 404, equal_weight 200, write+delete 200; test containers/images removed

## Needed from owner
- Decision to push `chore/audit`/merge to master (nothing pushed).
- For public hosting: domain/TLS, hosting, API key issuance policy.
- Optional: Alpha Vantage key.

## Next
- [x] all plan items done
