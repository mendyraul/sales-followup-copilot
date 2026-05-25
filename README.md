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

Detailed reference: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/PostgreSQL connection string used by the app and migrations. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | App name shown in the UI. |
| `SEND_MODE` | No | `manual` | Safety guard for outbound behavior. Keep `manual` for MVP/manual-safe workflows. |
| `AI_PROVIDER` | No | `mock` | AI backend selector. Use `mock` for local/manual testing. |
| `AI_API_KEY` | Depends on provider | _(empty)_ | API key for non-mock AI providers. Leave empty when using `mock`. |

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions


## Environment Variables

Copy `.env.example` to `.env` and fill values.

- `DATABASE_URL` (required): PostgreSQL connection string for Prisma.
- `NODE_ENV` (optional): `development` / `test` / `production`.
- `PORT` (optional): Local server port (default `3000`).
- `NEXTAUTH_URL` (required for auth flows): Base app URL.
- `NEXTAUTH_SECRET` (required for auth/session): Long random secret.
- `OPENAI_API_KEY` (required for AI draft generation): Provider API key.
- `OPENAI_MODEL` (optional): Model name override (default `gpt-4o-mini`).
- `LOG_LEVEL` (optional): `debug` / `info` / `warn` / `error`.

### Security Notes

- Never commit real `.env` files or secrets.
- Use `.env.local` for machine-specific overrides.
- Rotate `NEXTAUTH_SECRET` and API keys if exposed.
