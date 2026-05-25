# Environment Variables

This project is safe-by-default for local development. Start from `.env.example`.

## Required

### `DATABASE_URL`
- **Purpose:** Prisma + app database connection.
- **Example:** `postgresql://postgres:postgres@localhost:5432/sales_followup`
- **Notes:** Must point to a reachable Postgres instance before running migrations.

## Recommended

### `NEXT_PUBLIC_APP_NAME`
- **Purpose:** UI branding text shown in the app shell.
- **Default in example:** `Sales Follow-Up Copilot`

### `SEND_MODE`
- **Purpose:** Controls delivery behavior for follow-up actions.
- **Allowed values:** `manual` (recommended for local), `live` (production only)
- **Default in example:** `manual`

### `AI_PROVIDER`
- **Purpose:** Selects AI backend.
- **Allowed values:** `mock` (safe local), provider-specific values added later.
- **Default in example:** `mock`

### `AI_API_KEY`
- **Purpose:** Credential for non-mock AI providers.
- **Default in example:** empty string.
- **Notes:** Keep empty when `AI_PROVIDER=mock`.

## Setup checklist

1. `cp .env.example .env`
2. Confirm `DATABASE_URL` points to your local/containerized Postgres.
3. Keep `SEND_MODE=manual` in development.
4. Keep `AI_PROVIDER=mock` unless explicitly testing provider integration.
5. Never commit real API keys.
