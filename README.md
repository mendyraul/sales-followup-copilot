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

## Environment variables

Use `.env.example` as the source of truth and copy it to `.env` before running locally.

- `DATABASE_URL` — PostgreSQL connection string used by Prisma.
  - Local default: `postgresql://postgres:postgres@localhost:5432/sales_followup`
- `NEXT_PUBLIC_APP_NAME` — App name displayed in the UI.
- `SEND_MODE` — Outbound behavior guardrail.
  - `manual` (default): drafts only, no live sends.
  - `live`: enables real sending paths (only after explicit human approval).
- `AI_PROVIDER` — AI backend selector.
  - `mock` (default): deterministic local-safe behavior for testing.
  - other providers can be added behind the same interface.
- `AI_API_KEY` — API key for non-mock AI providers. Leave empty when using `mock`.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
