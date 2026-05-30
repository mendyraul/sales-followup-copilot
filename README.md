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
Create a local `.env` from `.env.example` and set the following values:

- `DATABASE_URL` *(required)*: Postgres connection string used by Prisma.
  - Example: `postgresql://postgres:postgres@localhost:5432/sales_followup`
- `NEXT_PUBLIC_APP_NAME` *(optional)*: UI display name for the app.
  - Default: `Sales Follow-Up Copilot`
- `SEND_MODE` *(required)*: Controls outbound behavior.
  - Allowed values: `manual` (default/safe), `live` (only when explicitly enabled)
- `AI_PROVIDER` *(required)*: AI backend selector.
  - Allowed values: `mock` (default), `openai` (or future providers)
- `AI_API_KEY` *(required when provider is live)*: API key for the selected provider.
  - Keep empty for `mock`; never commit real keys.

### Local safety checklist
- Keep `SEND_MODE=manual` during development and testing.
- Use `AI_PROVIDER=mock` unless you intentionally validate provider integration.
- Confirm `.env` is gitignored before adding any credentials.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
