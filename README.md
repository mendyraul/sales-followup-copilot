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

Use `.env.example` as the baseline. These are the currently supported variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `NEXT_PUBLIC_APP_NAME`: Display name shown in the UI.
- `SEND_MODE`: Delivery guardrail mode (`manual` by default; keep manual-safe mode for local/dev).
- `AI_PROVIDER`: LLM backend selector (`mock` by default for safe local testing).
- `AI_API_KEY`: API key for providers that require one (leave empty when using `mock`).

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
