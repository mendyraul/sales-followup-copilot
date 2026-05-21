# Sales Follow-Up Copilot

Sales Follow-Up Copilot helps SMB teams track leads, generate follow-up drafts, and keep momentum without dropping conversations.

This repository is the launch-ready MVP baseline.

## What’s in this MVP

- Lead tracking workflow (pipeline-ready foundation)
- Follow-up drafting foundation (provider abstraction + prompt hooks)
- Prisma + PostgreSQL data layer
- Next.js app scaffold for dashboard/queue UI
- CI workflow for lint/test checks
- Test-safe defaults (no live outbound sends by default)

## Tech Stack

- **Frontend/App:** Next.js + TypeScript
- **Data:** Prisma + PostgreSQL
- **Testing:** Vitest
- **Local infra:** Docker Compose

## Quick Start

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev
```

Then open: <http://localhost:3000>

## Environment Variables

Create `.env` from `.env.example` and configure at minimum:

- `DATABASE_URL` — Postgres connection string
- `SEND_MODE` — defaults to `manual` for safety
- AI provider keys (optional until AI draft generation is enabled)

## Safety Defaults

- `SEND_MODE=manual` by default
- No live email/SMS sending enabled in base scaffold
- No secrets committed to source
- Auditability expected for generated/sent actions

## Launch Checklist

- [ ] Confirm `.env` values for target environment
- [ ] Run migrations in deploy environment
- [ ] Verify CI green on main branch
- [ ] Validate manual QA checklist
- [ ] Add production AI provider credentials (if enabling draft generation)

## Roadmap (from active issues)

- Lead CRUD + status pipeline
- Follow-up sequence stages
- Next-action calculation + stale lead detection
- Queue UI and notes/timeline
- Tests expansion and docs hardening

## Contributing

1. Create a feature branch from `main`
2. Keep commits small and focused
3. Open PR with linked issue
4. Wait for review/CI before merge

## License

Private repository — all rights reserved.
