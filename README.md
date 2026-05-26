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
Copy `.env.example` to `.env` and update values as needed.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/PostgreSQL connection string used by app and migrations. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | UI app title shown in the frontend. |
| `SEND_MODE` | Yes | `manual` | Delivery safety mode. Keep `manual` for MVP/testing to prevent unintended sends. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. `mock` keeps local/dev deterministic behavior. |
| `AI_API_KEY` | Conditional | `""` | API key for the selected AI provider. Leave empty when `AI_PROVIDER=mock`. |

### Environment notes
- For local development, keep `SEND_MODE=manual`.
- Never commit `.env` or real secrets.
- When switching from `mock` to a live provider, set `AI_API_KEY` and validate in a non-production environment first.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
