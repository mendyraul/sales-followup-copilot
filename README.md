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
Copy `.env.example` to `.env` and adjust only what you need for local testing.

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `NEXT_PUBLIC_APP_NAME`: UI display name for the app.
- `SEND_MODE`: Delivery mode (`manual` by default; keep manual for safe testing).
- `AI_PROVIDER`: AI backend selector (`mock` by default).
- `AI_API_KEY`: API key for non-mock providers (leave empty while using mock).
