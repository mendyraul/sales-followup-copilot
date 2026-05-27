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
