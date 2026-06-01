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

## Scripts
- `npm run dev` — start local app
- `npm run test` — run unit tests
- `npm run lint` — run linting (if configured)
- `npm run build` — production build check

## Environment variables
Create `.env` from `.env.example` and set at least:
- `DATABASE_URL` — PostgreSQL connection string
- `SEND_MODE` — `manual` (default safe mode) or `live`
- `OPENAI_API_KEY` (optional for AI draft generation)

Recommended for MVP launch:
- Keep `SEND_MODE=manual` until review workflow is validated.
- Use separate staging and production databases.
- Rotate API keys before go-live.

## Deployment (MVP)
1. Provision PostgreSQL (managed or self-hosted).
2. Set production env vars in hosting provider.
3. Run migrations in target environment:
   - `npx prisma migrate deploy`
4. Build validation:
   - `npm ci && npm run build && npm run test`
5. Deploy app.
6. Smoke test:
   - Create lead
   - Generate follow-up draft
   - Approve/edit flow
   - Confirm audit log entry

## Launch checklist
- [ ] CI passing on default branch
- [ ] Production env vars set
- [ ] Database backup policy enabled
- [ ] `SEND_MODE=manual` confirmed for launch day
- [ ] Manual QA checklist completed
- [ ] Rollback plan documented

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
