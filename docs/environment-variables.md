# Environment Variables

This project is intentionally **manual-safe by default**. Keep `.env` local and never commit secrets.

## Setup

1. Copy the template:
   ```bash
   cp .env.example .env
   ```
2. Fill in values for your local environment.
3. Restart dev server after changes.

## Variable reference

### `DATABASE_URL`
PostgreSQL connection string used by Prisma and the app.

Example:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
```

### `NEXT_PUBLIC_APP_NAME`
UI display name shown in client-rendered components.

Example:
```env
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
```

### `SEND_MODE`
Controls outbound behavior.

Allowed values:
- `manual` (default, recommended): no live outbound sending
- `test`: allows test-mode send paths
- `live`: reserved for controlled production rollout

### `AI_PROVIDER`
Provider key for draft generation.

Current options:
- `mock` (default, safe local/dev behavior)
- `openai` (requires `AI_API_KEY`)

### `AI_API_KEY`
API key used when `AI_PROVIDER=openai`.

- Leave empty for `mock` provider.
- Store in `.env` only.
- Never commit this value.

## Example `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
```
