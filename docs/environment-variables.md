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
- `manual` (default, recommended): strict local/manual review mode with no live outbound sending
- `test`: explicit non-live validation mode for dry-run style send-path checks
- `live`: reserved for controlled production rollout and real outbound delivery

### `AI_PROVIDER`
Provider key for draft generation.

Current options:
- `mock` (default, safe local/dev behavior with deterministic local drafts)
- `openai` (requires `AI_API_KEY`)

Adapter note:
- `lib/aiProvider.ts` is the provider boundary used by draft-generation code.
- Keep new providers behind this contract instead of scattering provider-specific API calls across the app.

### `AI_API_KEY`
API key used when `AI_PROVIDER=openai`.

- Leave empty for `mock` provider.
- Store in `.env` only.
- Never commit this value.

### `FEEDBACK_CAPTURE_ENABLED`
Feature flag for feedback capture flows.

Allowed values:
- `true` (default): enable manual/dev feedback capture
- `false`: disable feedback capture writes

### `FEEDBACK_DEFAULT_CHANNEL`
Default source tag used when feedback is captured without an explicit channel.

Example:
```env
FEEDBACK_DEFAULT_CHANNEL="in_app"
```

## Example `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
FEEDBACK_CAPTURE_ENABLED="true"
FEEDBACK_DEFAULT_CHANNEL="in_app"
```
