# Sales Follow-Up Copilot

Manual-safe MVP for SMB lead follow-up workflows (track leads, generate draft follow-ups, review before send).

## Launch scope (MVP)

### Included now
- Lead tracking foundation (status pipeline + next actions)
- Draft follow-up generation flow (manual approval only)
- Local PostgreSQL + Prisma persistence
- Safety-first defaults (`SEND_MODE=manual`, `AI_PROVIDER=mock`)
- CI checks for tests + production build

### Not included in this launch
- Autonomous outbound sending
- Production credentials in repo
- Direct-to-main deployment changes

## Stack
- Next.js 14 + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose
- GitHub Actions

## Quick start (under 3 minutes)
1. Copy env file
2. Start Postgres
3. Install dependencies
4. Run Prisma migrations
5. Start the app

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev
```

## MVP workflow
1. Add/import leads
2. Track where each lead is in the follow-up pipeline
3. Generate draft follow-up copy (mock provider by default)
4. Approve/edit/reject drafts manually
5. Capture feedback on drafts/outcomes for continuous prompt/process tuning
6. Log actions for auditability

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/PostgreSQL connection string for local development. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | Display name shown in the app UI. |
| `SEND_MODE` | Yes | `manual` | Safety switch for outbound behavior. Keep `manual` for local/testing workflows. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. Use `mock` by default to avoid external provider calls. |
| `AI_API_KEY` | Conditionally | empty | API key for non-mock AI providers. Leave empty when `AI_PROVIDER=mock`. |

## Safety defaults
- `SEND_MODE=manual` by default
- `AI_PROVIDER=mock` by default
- No secrets committed
- Human review required before any outbound messaging

## Feedback capture (MVP baseline)
- Prisma model `FeedbackEvent` added for explicit feedback records
- Supports optional link to `leadId` and/or `draftId`
- Stores rating/category/comment and capture source (`capturedBy`)
- Enables future prompt tuning and QA dashboards without changing existing lead/draft flows

## CI
- GitHub Actions runs `npm run test` and `npm run build`
- Triggers on `main`, `dev`, `feature/*`, and pull requests
- Workflow file: `.github/workflows/ci.yml`

## Launch verification checklist
- [ ] `docker compose up -d db`
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `SEND_MODE=manual` confirmed in `.env`
- [ ] `AI_PROVIDER=mock` confirmed in `.env` (unless explicitly testing real provider)
