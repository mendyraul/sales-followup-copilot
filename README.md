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
- `DATABASE_URL`: Postgres connection string used by Prisma.
- `NEXT_PUBLIC_APP_NAME`: UI app name shown in the frontend.
- `SEND_MODE`: Message delivery mode (`manual` by default; keep non-live for local dev).
- `AI_PROVIDER`: AI provider routing key (`mock` by default for safe local runs).
- `AI_API_KEY`: API key for non-mock providers (leave empty for mock/local testing).

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
