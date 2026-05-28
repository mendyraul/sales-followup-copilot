# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## What this does
Sales Follow-Up Copilot helps a small team track leads, draft follow-ups, and keep manual review in the loop before anything is sent.

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

Use `.env.example` as the baseline. These are the currently supported variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `NEXT_PUBLIC_APP_NAME`: Display name shown in the UI.
- `SEND_MODE`: Delivery guardrail mode (`manual` by default; keep manual-safe mode for local/dev).
- `AI_PROVIDER`: LLM backend selector (`mock` by default for safe local testing).
- `AI_API_KEY`: API key for providers that require one (leave empty when using `mock`).

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Launch README

### Current maturity
- **Status:** MVP scaffold + core safety defaults
- **Intended users:** solo founders / small sales teams
- **Risk posture:** manual review-first, no autonomous sending

### Launch scope (v0)
- Lead capture + list view
- Follow-up draft generation with provider abstraction
- Manual approve/edit/reject workflow
- Basic notes/timeline
- CSV import for initial lead set
- Test coverage on core flows

### Launch checklist
- [ ] Confirm `.env` configured in target environment
- [ ] Run DB migrations successfully
- [ ] Validate draft generation in `mock` mode
- [ ] Validate approve/edit/reject flow end-to-end
- [ ] Validate CSV import with sample file
- [ ] Ensure `SEND_MODE=manual` before release
- [ ] Run tests and fix failures (`npm test`)
- [ ] Smoke test critical pages in deployed environment

### Pre-launch QA script
1. Create at least 3 leads with different statuses.
2. Generate first follow-up draft for each lead.
3. Approve one draft, edit one, reject one.
4. Add notes/timeline entries and verify persistence.
5. Import 10 leads via CSV and confirm no malformed rows.
6. Re-run draft generation on imported records.
7. Confirm no action sends externally when in manual mode.

### Post-launch operating notes
- Keep manual mode enabled until human QA sign-off.
- Log product issues as GitHub issues with reproduction steps.
- Track launch bugs separately from feature roadmap items.
- Review audit logs weekly during early rollout.

## Development workflow
1. Create feature branch from `main`
2. Commit with clear scope
3. Open PR to `dev` (or target integration branch)
4. Attach issue references and validation notes
5. Merge only after checks and review are clean
