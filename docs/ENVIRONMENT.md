# Environment Variables

This project runs safely in manual mode by default. Keep real provider credentials out of source control.

## Variable Reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Postgres connection string for Prisma and app runtime. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | App display name in UI. |
| `SEND_MODE` | No | `manual` | Safety mode: `manual` (recommended) or `test`. |
| `AI_PROVIDER` | No | `mock` | AI provider adapter (`mock` for local-safe/demo runs). |
| `AI_API_KEY` | Conditional | — | Required only when using a real AI provider. |

## Recommended Values by Environment

| Environment | `SEND_MODE` | `AI_PROVIDER` | `AI_API_KEY` |
|---|---|---|---|
| Local development | `manual` | `mock` | Not set |
| Demo / QA | `manual` | `mock` | Not set |
| Controlled provider testing | `test` | non-`mock` provider | Required |

## Example `.env`

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup?schema=public"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
# AI_API_KEY=""
```

## Validation Checklist

- `DATABASE_URL` points to a reachable Postgres instance.
- `SEND_MODE` is one of: `manual`, `test`.
- `AI_PROVIDER=mock` unless intentionally testing a real provider.
- `AI_API_KEY` is set only when a real provider is enabled.
- `.env` is present locally and never committed.

## Safe Defaults

- Use `SEND_MODE=manual` unless explicitly testing controlled sends.
- Keep `AI_PROVIDER=mock` for development and demos.
- Never commit `.env` or real API keys.

## Setup

1. `cp .env.example .env`
2. Fill `DATABASE_URL`
3. Optionally set branding and provider values
4. Start app with `npm run dev`

## Troubleshooting

- **Prisma cannot connect**: verify Postgres is running and `DATABASE_URL` host/port are correct.
- **App boots with missing env errors**: recreate `.env` from `.env.example` and reapply values.
- **Unexpected outbound behavior**: confirm `SEND_MODE=manual` and `AI_PROVIDER=mock`.
