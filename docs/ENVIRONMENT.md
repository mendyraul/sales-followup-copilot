# Environment Variables

This project runs safely in manual mode by default. Keep real provider credentials out of source control.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Postgres connection string for Prisma and app runtime. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | App display name in UI. |
| `SEND_MODE` | No | `manual` | Safety mode: `manual` (recommended) or `test`. |
| `AI_PROVIDER` | No | `mock` | AI provider adapter (`mock` for local-safe/demo runs). |
| `AI_API_KEY` | Conditional | — | Required only when using a real AI provider. |

## Safe Defaults
- Use `SEND_MODE=manual` unless explicitly testing controlled sends.
- Keep `AI_PROVIDER=mock` for development and demos.
- Never commit `.env` or real API keys.

## Setup
1. `cp .env.example .env`
2. Fill `DATABASE_URL`
3. Optionally set branding and provider values
4. Start app with `npm run dev`
