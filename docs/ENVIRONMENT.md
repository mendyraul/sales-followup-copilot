# Environment Variables

This project defaults to safe local execution.

## Required

### `DATABASE_URL`
PostgreSQL connection string used by Prisma and the app runtime.

Example:
`postgresql://postgres:postgres@localhost:5432/sales_followup`

## Optional with safe defaults

### `NEXT_PUBLIC_APP_NAME`
UI display name.
Default: `Sales Follow-Up Copilot`

### `SEND_MODE`
Outbound mode guardrail.
- `manual` (recommended for beta)
- `live` (only when explicitly approved)

Default: `manual`

### `AI_PROVIDER`
Provider selector for draft generation.
- `mock` (recommended default)
- provider-specific values if configured later

Default: `mock`

### `AI_API_KEY`
API key for non-mock providers.
Leave blank when using `mock`.

## Setup
1. `cp .env.example .env`
2. Update values only if needed
3. Run `docker compose up -d db`
4. Run `npx prisma migrate dev`
5. Start app with `npm run dev`
