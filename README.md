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

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | PostgreSQL connection string used by Prisma and app runtime. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | UI display name shown in client-rendered pages. |
| `SEND_MODE` | Yes | `manual` | Safety gate for outbound actions. Keep `manual` for local/dev testing. |
| `AI_PROVIDER` | Yes | `mock` | LLM adapter to use for draft generation. `mock` avoids external calls. |
| `AI_API_KEY` | Conditional | empty | Required only when using a real AI provider; keep empty for `mock`. |

### Environment setup notes
- **Local dev (recommended):** keep `SEND_MODE=manual`, `AI_PROVIDER=mock`, and `AI_API_KEY` empty.
- **Never commit `.env` files** with real credentials.
- If you use a managed database, update `DATABASE_URL` to your provider DSN.
- If enabling a real AI provider, validate usage in manual mode first before any live workflow.
- See `docs/environment.md` for profiles, troubleshooting, and security guidance.
