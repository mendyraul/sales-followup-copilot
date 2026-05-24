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

- `DATABASE_URL` — PostgreSQL connection string used by Prisma and the app.
- `NEXT_PUBLIC_APP_NAME` — display name shown in the UI.
- `SEND_MODE` — outbound behavior mode (`manual` by default, keeps sending disabled).
- `AI_PROVIDER` — provider abstraction selector (`mock` by default for safe local testing).
- `AI_API_KEY` — API key for non-mock providers. Leave empty when using `mock`.

### Recommended local defaults
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
```

Full variable reference: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
