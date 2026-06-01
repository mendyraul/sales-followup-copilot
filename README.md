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

### Required
- `DATABASE_URL` — PostgreSQL connection string used by Prisma.

### Optional (safe defaults)
- `SEND_MODE` — message delivery mode (`manual` by default; keep this in non-live environments).
- `APP_BASE_URL` — base URL for links in UI/emails (defaults to localhost in dev).
- `OPENAI_API_KEY` — only required if AI draft generation is enabled.

### Example `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
SEND_MODE="manual"
APP_BASE_URL="http://localhost:3000"
# OPENAI_API_KEY=""
```

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
