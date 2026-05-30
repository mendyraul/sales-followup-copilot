# AI Sales Follow-Up Copilot

Manual-safe MVP for managing sales leads and drafting AI-assisted follow-up messages without enabling live outbound delivery by default.

## Why this exists
Small teams lose deals when follow-ups are inconsistent. This project provides a structured queue, suggested next actions, and editable message drafts so humans can move faster while staying in control.

## MVP goals
- Capture and manage leads in one place
- Track follow-up state and timeline history
- Generate first-draft outreach content for human review
- Keep strict manual/test safeguards as the default

## Current status
Scaffold + core infrastructure in progress. This repo is actively developed through issue-driven slices.

## Tech stack
- **Frontend/API:** Next.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Testing:** Vitest
- **Local infra:** Docker Compose

## Safety-first defaults
- `SEND_MODE=manual` by default (no live sends)
- No production credentials required for local development
- Drafts are intended for approve/edit/reject workflow
- Auditability is part of the product direction

## Quick start
```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000

## Environment variables
See `.env.example` for full list. Minimum local values:
- `DATABASE_URL`
- `SEND_MODE=manual`
- Optional AI provider keys only when testing draft generation

## Development workflow
1. Create/claim an issue
2. Branch from base branch (`agent/sales-copilot-mvp-scaffold`)
3. Implement one scoped slice
4. Add/update tests where applicable
5. Open PR to `dev` (no direct push to `main`)

## Testing
```bash
npm test
```

## Launch checklist (MVP)
- [ ] Lead CRUD
- [ ] Pipeline/status tracking
- [ ] Queue UI and next-action logic
- [ ] Draft generation + review workflow
- [ ] Manual QA checklist
- [ ] Deployment and environment docs

## Non-goals (for now)
- Fully autonomous outbound sending
- Production secrets in repo
- Direct-to-main release flow

## Contributing
Internal repo for Raul projects. Keep PRs scoped, reversible, and documented.
