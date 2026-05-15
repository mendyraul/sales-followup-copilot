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

## Roadmap
- **M1:** scaffold + lead CRUD + dashboard
- **M2:** AI drafting + approval workflow + audit
- **M3:** queue + stale/hot logic + timeline
- **M4:** CSV import + demo data + beta readiness docs

After M4, begin AR project deeper implementation.
