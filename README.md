# Sales Follow-Up Copilot

AI-assisted SaaS MVP for service businesses to prevent inbound leads from going cold.

## Final Product Goal
Help SMB teams reliably follow up with every inbound lead by providing:
- fast lead capture/import
- AI-drafted follow-up messages
- human approval before any send
- lead stage tracking
- a "next best action" queue for hot/stale opportunities

Core promise: **"Never lose another inbound lead because nobody followed up."**

---

## Target Users
- Contractors, HVAC, roofers, plumbers, cleaners
- Med spas, law firms, local agencies
- Small service businesses with inconsistent lead follow-up

---

## MVP Scope (v1)
- Single-user auth/account scaffold
- Lead CRUD
- Lead status pipeline: `new`, `contacted`, `replied`, `hot`, `won`, `lost`
- AI follow-up draft generation (manual/test mode)
- Approve / edit / reject flow
- Follow-up sequence stages: first response, 24h, 3d, final
- Next best action queue
- Notes/timeline per lead
- CSV import
- Audit logs for generated/sent actions
- `.env.example`, CI, tests for core business logic

## Explicit Non-Goals (first pass)
- Live outbound sending by default
- Full billing
- Complex admin/roles
- Advanced analytics
- Multi-provider integrations all at once

---

## Technical Structure

## Stack
- Next.js + TypeScript (full-stack app)
- PostgreSQL
- Prisma ORM
- Vitest for core logic tests
- Docker Compose for local dev
- GitHub Actions for CI

## Repo layout
- `prisma/schema.prisma` — core data model
- `src/app/` — UI/routes
- `src/domain/` — business logic (queue, stages, rules)
- `src/lib/` — infrastructure/adapters (AI provider, audit, storage)
- `src/tests/` — unit/integration tests
- `.github/workflows/ci.yml` — CI
- `.github/ISSUE_TEMPLATE/saas-task.md` — issue template

---

## Data Model (current scaffold)
- `Lead`
- `FollowUpDraft`
- `LeadEvent`
- `AuditLog`

Safety fields included in lead model:
- `unsubscribed`
- `optOutReason`

---

## Safety & Compliance Defaults
- `SEND_MODE=manual` by default
- no live email/SMS enabled in MVP baseline
- no secrets in source control
- no hardcoded API keys
- manual approval required before sending
- audit logs required for generated/approved/rejected/sent-attempt events

---

## Local Setup (demoable <3 min)
1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Start database:
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start app:
   ```bash
   npm run dev
   ```

Open: `http://localhost:3000`

---

## Environment Variables
Detailed env reference: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)

Quick list:
- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_APP_NAME` — UI app name
- `SEND_MODE` — `manual` or `test` (default: `manual`)
- `AI_PROVIDER` — `mock` by default
- `AI_API_KEY` — optional, only if real provider enabled

---

## Testing
Run:
```bash
npm test
```

Optional quality checks:
```bash
npm run lint
npm run build
```

Required focus:
- status transitions
- follow-up sequence logic
- queue prioritization
- stale/hot lead detection
- opt-out safety checks

---

## Delivery Workflow
- branch naming: `agent/sales-copilot-<task>`
- no direct push to `main` (bootstrap exception already completed)
- PR required for each feature
- PR must include summary, tests run, and demo steps

---

## Launch Readiness (Beta)

Detailed operator runbook: [`docs/LAUNCH.md`](docs/LAUNCH.md)


### Launch Story
Sales Follow-Up Copilot is ready for beta when a single user can:
1. Add/import leads quickly
2. Generate follow-up drafts safely in manual mode
3. Approve/edit/reject drafts with clear audit history
4. Prioritize hot/stale leads with a next-action queue

### Beta Launch Checklist
- [ ] Local setup succeeds from clean clone (`cp .env.example .env`, `docker compose up -d db`, install, migrate, run)
- [ ] Core lead workflow works end-to-end (create lead → update stage → add notes)
- [ ] AI draft flow works in `SEND_MODE=manual` with approval/edit/reject actions
- [ ] Audit log entries captured for generation and approval decisions
- [ ] Queue correctly surfaces stale and hot leads
- [ ] CSV import works with sample file and handles invalid rows safely
- [ ] Unit tests pass in CI and locally
- [ ] README + env docs are accurate and complete
- [ ] No secrets committed; no direct-to-main changes

### Demo Script (10 minutes)
1. Start app and seed demo data
2. Show dashboard and pipeline stage movement
3. Pick a stale lead and generate first follow-up draft
4. Edit + approve draft (manual mode only)
5. Show timeline/audit trail and queue reprioritization
6. Import a short CSV and verify new leads appear

### Troubleshooting
- **`docker compose up -d db` fails**: ensure Docker Desktop/Engine is running, then retry.
- **Prisma migration errors**: confirm `DATABASE_URL` in `.env` points to the local Postgres service.
- **Port 3000 already in use**: run `PORT=3001 npm run dev` and open `http://localhost:3001`.
- **Tests fail after dependency updates**: clear `node_modules` and reinstall with `npm ci`.

### Exit Criteria for Beta
- A real test user can complete setup in under 15 minutes
- At least one lead can be taken from `new` to `contacted` using manual-safe workflow
- No blocking bugs in lead CRUD, draft workflow, queue, or import path

### Go / No-Go Decision Grid
- **Go** when all of the below are true:
  - Demo script completes without manual DB edits
  - No `priority:p1` open bugs in launch scope
  - `npm test` passes on clean install
  - Manual approval path verified by a second reviewer
- **No-Go** if any of the below are true:
  - Queue prioritization misorders hot/stale leads
  - Audit trail missing for generate/approve/reject actions
  - CSV import corrupts lead state or silently drops rows
  - Setup steps in README drift from real bootstrap commands

### Known Beta Limitations
- Single-user workflow only (no team roles/permissions yet)
- Outbound providers remain manual/test-first; no default live sending
- Queue scoring is rule-based and intentionally simple for MVP
- Import path assumes clean CSV headers from the provided template

## Roadmap
- **M1:** scaffold + lead CRUD + dashboard
- **M2:** AI drafting + approval workflow + audit
- **M3:** queue + stale/hot logic + timeline
- **M4:** CSV import + demo data + beta readiness docs

After M4, begin AR project deeper implementation.

## Quick Launch Gate (Operator TL;DR)
Before onboarding pilot users, confirm:
- [ ] `SEND_MODE=manual` in deployed environment
- [ ] Core flow passes: lead create -> draft -> approve/edit/reject -> audit log
- [ ] `npm test` passing on clean install
- [ ] Rollback + backup procedure documented
