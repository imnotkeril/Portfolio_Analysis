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
- [!] T03 Docker non-root/127.0.0.1 ports committed but NOT live-verified: after the change `docker compose up` api exited(1) (log not captured, Docker Desktop then hung). First thing next session: `docker compose up` on random ports, read `docker logs`, likely uid/permission on mounted ./src/data or config.py mkdir.

## Needed from owner
- Decision to push `chore/audit`/merge to master (nothing pushed).
- For public hosting: domain/TLS, hosting, API key issuance policy.
- Optional: Alpha Vantage key.

## Next
- [ ] T03 live-verify Docker (see above), then T08 final audit note
