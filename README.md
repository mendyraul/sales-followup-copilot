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
Copy `.env.example` to `.env` and adjust only what you need for local development.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/Postgres connection string used by migrations and runtime. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | UI display name for the app header and metadata. |
| `SEND_MODE` | Yes | `manual` | Delivery safety mode. Keep as `manual` for local/test usage. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. `mock` avoids real provider calls. |
| `AI_API_KEY` | No (with `mock`) | empty | API key for real AI providers. Leave blank in local mock mode. |

### Safe local defaults
- Use `SEND_MODE=manual` unless intentionally testing a controlled send flow.
- Keep `AI_PROVIDER=mock` for day-to-day development.
- Never commit real secrets into `.env.example` or tracked files.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
