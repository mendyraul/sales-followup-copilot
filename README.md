# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## Stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Quick start (under 3 minutes)
1. Copy env: `cp .env.example .env`
2. Start db: `docker compose up -d db`
3. Install deps: `npm install`
4. Prisma: `npx prisma migrate dev --name init`
5. Run app: `npm run dev`

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/PostgreSQL connection string for local development. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | Display name shown in the app UI. |
| `SEND_MODE` | Yes | `manual` | Safety switch for outbound behavior. Keep `manual` for local/testing workflows. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. Use `mock` by default to avoid external provider calls. |
| `AI_API_KEY` | Conditionally | empty | API key for non-mock AI providers. Leave empty when `AI_PROVIDER=mock`. |

### Safe local defaults
- Keep `SEND_MODE=manual` unless Raul explicitly approves live sending.
- Keep `AI_PROVIDER=mock` for deterministic local development.
- Never commit populated API keys or production database URLs.

## Environment profiles

### Local-safe profile (default)
```env
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
```

### External AI test profile (manual only)
```env
SEND_MODE="manual"
AI_PROVIDER="openai"
AI_API_KEY="<local-test-key>"
```


## CI
- GitHub Actions runs tests and a production build on pushes (main/dev/feature/*) and pull requests.
- Workflow file: `.github/workflows/ci.yml`.

## Launch README (MVP)
This repo ships a **manual-safe MVP** for sales follow-up drafting. Launch means making it usable for controlled internal testing without enabling live outbound sending.

### Launch goals
- Stand up app + DB locally and in a preview deployment.
- Confirm core lead workflow is usable end-to-end.
- Keep all outbound actions manual/test-mode only.
- Capture feedback and known gaps before broader rollout.

### Launch checklist
- [ ] Environment variables configured (`.env` based on `.env.example`)
- [ ] Database migrations applied (`npx prisma migrate dev`)
- [ ] Unit tests passing (`npm test`)
- [ ] App boots locally (`npm run dev`)
- [ ] Manual QA pass completed (see checklist below)
- [ ] No secrets committed
- [ ] Feature branch PR opened for review

### Manual QA checklist
1. Create/edit a lead record and verify persistence.
2. Generate a follow-up draft and verify output is stored.
3. Confirm `SEND_MODE=manual` blocks any live-send behavior.
4. Confirm timeline/notes updates appear correctly.
5. Validate basic UX on desktop for list/detail workflow.

### Release guardrails
- **Do not** switch to live send mode by default.
- **Do not** commit production credentials or tokens.
- Merge flow: `feature/*` → `dev` (human promotes `dev` → `main`).

### Known launch assumptions
- MVP focuses on reliability + auditability over automation.
- AI provider defaults to `mock` for deterministic testing.
- Integrations and advanced automation are deferred to follow-up milestones.
