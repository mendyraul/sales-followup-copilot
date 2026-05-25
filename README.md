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
Copy `.env.example` to `.env` and configure values for your machine.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | PostgreSQL connection string used by Prisma and the app. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | Public app name shown in UI. |
| `SEND_MODE` | Yes | `manual` | Sending guardrail mode. Use `manual` for safe local testing. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. Keep `mock` in development until real provider wiring is complete. |
| `AI_API_KEY` | Conditionally | _empty_ | API key for the selected non-mock AI provider. Leave empty when `AI_PROVIDER=mock`. |

### Recommended local setup
1. Keep `SEND_MODE=manual` while developing.
2. Leave `AI_PROVIDER=mock` and `AI_API_KEY` empty for deterministic offline-safe runs.
3. Confirm your database is reachable before running migrations.

See full variable reference: [`docs/environment-variables.md`](docs/environment-variables.md).
