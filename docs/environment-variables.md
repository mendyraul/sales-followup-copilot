# Environment Variables

This project is intentionally safe-by-default for local testing.

## Required for local development

### `DATABASE_URL`
- **Required:** Yes
- **Used by:** Prisma + app runtime
- **Example:** `postgresql://postgres:postgres@localhost:5432/sales_followup`

### `SEND_MODE`
- **Required:** Yes
- **Allowed values:** `manual`, `live`
- **Recommended local value:** `manual`
- **Why:** prevents accidental outbound messages.

### `AI_PROVIDER`
- **Required:** Yes
- **Allowed values (current):** `mock`
- **Recommended local value:** `mock`

## Optional / conditional

### `AI_API_KEY`
- **Required:** Only when `AI_PROVIDER` uses a real external model provider.
- **Recommended local value:** empty

### `NEXT_PUBLIC_APP_NAME`
- **Required:** No
- **Default:** `Sales Follow-Up Copilot`
- **Purpose:** branding label in UI.

## Safe local baseline

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
```

## Validation checklist

1. `cp .env.example .env`
2. Confirm `SEND_MODE=manual`
3. Confirm `AI_PROVIDER=mock`
4. Run `npx prisma migrate dev --name init`
5. Start app with `npm run dev`
