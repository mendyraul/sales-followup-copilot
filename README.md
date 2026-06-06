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
- `SEND_MODE=manual` by default
- No live email/SMS sending enabled
- No production credentials required for local development
- Drafts are intended for approve/edit/reject workflow
- Audit logs are expected for generated/sent actions
- Keep secrets local and out of source control

## Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the local database:
   ```bash
   docker compose up -d db
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Testing
```bash
npm test -- --run
```

## Useful commands
- Stop database: `docker compose down`
- Recreate clean database volume: `docker compose down -v && docker compose up -d db`
- Generate Prisma client: `npx prisma generate`

## Environment variables
- See `.env.example` for the template
- Full reference: [`docs/environment-variables.md`](docs/environment-variables.md)
- Minimum local values: `DATABASE_URL` and `SEND_MODE=manual`
- AI provider keys are optional and only needed for draft-generation testing

## Development workflow
1. Create or claim an issue
2. Branch from `agent/sales-copilot-mvp-scaffold`
3. Implement one scoped slice
4. Add/update tests where applicable
5. Open a PR to the intended integration branch

## Launch checklist (MVP)
- [ ] Lead CRUD
- [ ] Pipeline/status tracking
- [ ] Queue UI and next-action logic
- [ ] Draft generation + review workflow
- [ ] Manual QA checklist
- [ ] Deployment and environment docs

## Deployment
See [`docs/deployment.md`](docs/deployment.md) for production-safe deployment steps and post-deploy checks.

## Non-goals (for now)
- Fully autonomous outbound sending
- Production secrets in repo
- Direct-to-main release flow

## Contributing
Internal repo for Raul projects. Keep PRs scoped, reversible, and documented.
