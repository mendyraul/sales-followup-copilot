# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## Stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Setup instructions

### Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose

### Quick start (under 3 minutes)
1. Copy environment variables:
   - `cp .env.example .env`
2. Start PostgreSQL:
   - `docker compose up -d db`
3. Install dependencies:
   - `npm install`
4. Apply database migrations:
   - `npx prisma migrate dev --name init`
5. Start the app:
   - `npm run dev`
6. Open:
   - `http://localhost:3000`

### Verify your setup
- Confirm DB is up: `docker compose ps`
- Confirm Prisma can connect: `npx prisma db pull`
- Confirm tests run: `npm test`

### Environment variables
Use `.env.example` as the source of truth.

- `DATABASE_URL`: Postgres connection string
- `NEXT_PUBLIC_APP_NAME`: Frontend app name
- `SEND_MODE`: Keep `manual` for safe local testing
- `AI_PROVIDER`: `mock` by default for local development
- `AI_API_KEY`: Optional unless using a real provider

### Common local reset
If you want to reset local state:
- `docker compose down -v`
- `docker compose up -d db`
- `npx prisma migrate reset`

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
