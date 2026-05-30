# LeakLens — Leaked-Data Intelligence Platform

LeakLens is an IntelX-style search tool for **leaked data and breach records**.
Search by **email, username, IP, password, full name, hash, or domain** and get
the exact databases and exposed fields — passwords, hashes, names, IPs — that
match, plus context like subdomains, WHOIS, and reputation.

It is powered by the **Snusbase** API as the primary engine, with free, keyless
supplements (LeakCheck public, EmailRep.io, Cert Spotter) layered on to enrich
thin results.

> **Authorized use only.** LeakLens is built for defenders, incident responders,
> and security researchers monitoring their **own** organizations and assets.
> Use must comply with the laws and terms applicable to you.

---

## Features

- **7 search types** — email, username, IP, password, full name, hash, domain.
- **Wildcard search** — `%` (any) and `_` (single char) patterns.
- **Multi-term** — comma-separate several terms in one query.
- **Full records** — exposed fields per source database, with severity and a
  reveal/copy control for credentials and hashes.
- **Context & enrichment** — Cert Spotter subdomains and Snusbase WHOIS for
  domains/IPs, EmailRep reputation and LeakCheck breach names for emails.
- **Search history** and **RBAC** (admin / analyst / viewer).
- **Security hardened** — JWT auth with refresh + lockout, rate limiting,
  strict security headers, non-root Alpine containers.

## Architecture

```
Next.js (Vercel)  ──HTTPS + JWT──▶  FastAPI  ──▶ PostgreSQL (users / history)
                                       │
                                       ├──▶ Snusbase API (primary leak engine)
                                       └──▶ Free supplements (LeakCheck / EmailRep / Cert Spotter)
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Zustand |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic v2 |
| Database | PostgreSQL 16 |
| Data | Snusbase API + free OSINT supplements (httpx) |
| Infra | Docker Compose (Alpine, multi-stage, non-root), Caddy (TLS), Vercel |

## Quick start (development)

Prerequisites: Docker + Docker Compose, Node 18+ (for the frontend), and a
Snusbase activation code (doubles as the API key).

```bash
# 1. Backend (Postgres + API)
cp .env.example .env          # set SECRET_KEY, POSTGRES_PASSWORD, SNUSBASE_API_KEY
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 2. Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API (debug docs): http://localhost:8000/docs

Register an account at `/register`, then run a search.

### Making yourself an admin

New users default to the `analyst` role. To promote a user:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Configuration

All backend settings come from environment variables — see
[`.env.example`](.env.example). The only required source key is
`SNUSBASE_API_KEY`. The free supplements (`ENABLE_LEAKCHECK_PUBLIC`,
`ENABLE_EMAILREP`, `ENABLE_CERTSPOTTER`) need no key and can be toggled off.

## Data sources

| Source | Type | Needs key? | Search by |
|--------|------|------------|-----------|
| Snusbase | breach records | yes | email / username / ip / password / hash / name / domain |
| LeakCheck (public) | breach names | no | email |
| EmailRep.io | reputation | optional | email |
| Cert Spotter | subdomains / certs | no | domain |
| Snusbase WHOIS | domain / IP whois | yes | domain / ip |

## Docker best practices

- **Alpine** base images, **multi-stage** build (wheels compiled in a builder
  stage, minimal runtime).
- Runs as a **non-root** user; `no-new-privileges` and CPU/memory limits set in
  Compose.
- `.dockerignore` keeps secrets and build cruft out of the image.
- **Trivy** scan helper: `sh deploy/trivy-scan.sh` (fails on HIGH/CRITICAL).

## Production deployment

- **Backend** runs on a VPS via `docker compose up -d --build` behind
  [`deploy/Caddyfile`](deploy/Caddyfile) (automatic TLS).
- **Frontend** deploys to Vercel; set `NEXT_PUBLIC_API_URL` to your API domain.
- Set `ENVIRONMENT=production`, a strong `SECRET_KEY`, and real DB credentials.

## Project layout

```
backend/app/
  api/v1/        auth, search, history
  core/          config, security, database, rate_limit
  services/      snusbase, enrichment, aggregator, validators
  models/        user, search
  schemas/       user, search
frontend/src/
  app/           landing, (auth), (app)/{search,history}
  components/    SearchBar, ResultCard, ResultList, EnrichmentPanel, Navbar, ui/
  lib/           api, useAuth, useSearch, utils
```

## License / disclaimer

Educational PFA project. Use responsibly and legally. The authors are not
responsible for misuse.
