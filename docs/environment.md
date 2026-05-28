# Environment Variables

This project is intentionally **manual-safe by default**. Start from `.env.example`.

## Required

### `DATABASE_URL`
PostgreSQL connection string used by Prisma.

Example:
`postgresql://postgres:postgres@localhost:5432/sales_followup`

## Optional / Defaulted

### `NEXT_PUBLIC_APP_NAME`
UI display name.
Default: `Sales Follow-Up Copilot`

### `SEND_MODE`
Controls outbound delivery behavior.

Allowed values:
- `manual` (recommended/default): no autonomous live sends

### `AI_PROVIDER`
Selects the drafting provider.

Allowed values:
- `mock` (default): local-safe deterministic behavior

### `AI_API_KEY`
Provider API key for non-mock providers.
Leave empty when `AI_PROVIDER=mock`.

## Local setup
1. `cp .env.example .env`
2. Confirm `SEND_MODE=manual`
3. Run migrations: `npx prisma migrate dev --name init`
4. Start app: `npm run dev`

## Safety checks before running
- `.env` is not committed
- No production credentials in local env files
- `SEND_MODE=manual` in local and deployed preview environments
