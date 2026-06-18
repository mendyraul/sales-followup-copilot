# AI Sales Follow-Up Copilot

Manual-safe MVP for managing sales leads and drafting AI-assisted follow-up messages without enabling live outbound delivery by default.

## Why this exists
Small teams lose deals when follow-ups are inconsistent. This project provides a structured queue, suggested next actions, and editable message drafts so humans can move faster while staying in control.

## MVP goals
- Capture and manage leads in one place
- Track follow-up state, timeline history, and structured lead notes
- Generate first-draft outreach content for human review
- Keep strict manual/test safeguards as the default

## Current status
Scaffold + core infrastructure in progress. This repo is actively developed through issue-driven slices.

## Tech stack
- **Frontend/API:** Next.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Testing:** Vitest
- **Local infra:** Docker Compose
- **CI:** GitHub Actions

## CSV lead import

Run bulk CSV import:

```bash
npm run import:csv -- ./data/leads.csv
```

Expected headers:
- `name` (required)
- `email` (required)
- `source` (optional)
- `status` (optional, defaults to `NEW`)

## Manual QA checklist
- [ ] App starts locally (`npm run dev`) without runtime errors.
- [ ] Lead list/dashboard loads with demo data.
- [ ] Creating and editing a lead works end-to-end.
- [ ] Follow-up draft generation works in `AI_PROVIDER=mock` mode.
- [ ] Outbound actions remain blocked unless `SEND_MODE=manual` is intentionally changed.
- [ ] No secrets are printed in logs or committed to git.

## Safety-first defaults
- `SEND_MODE=manual` by default
- `SEND_MODE=live` is the only value that enables live sending behavior
- No live email/SMS sending enabled unless explicitly switched to `live`
- No production credentials required for local development
- Drafts are intended for approve/edit/reject workflow
- No secrets in source control
- Audit logs are expected for generated/sent actions

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
5. Seed demo data (optional but recommended for demos):
   ```bash
   npm run db:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Testing
```bash
npm test -- --run
```

Core focus areas:
- status transitions
- follow-up sequence logic
- queue prioritization
- stale/hot lead detection
- opt-out safety checks

## Continuous Integration
GitHub Actions in `.github/workflows/ci.yml` run on pull requests and integration-branch pushes to:
- install dependencies with `npm ci`
- run linting with `npm run lint`
- run TypeScript type checks with `npm run typecheck`
- run tests with `npm test -- --run`
- run the production build with `npm run build`

## Useful commands
- Stop database: `docker compose down`
- Recreate clean database volume: `docker compose down -v && docker compose up -d db`
- Generate Prisma client: `npx prisma generate`
- Seed demo data: `npm run db:seed`

## Lead notes + timeline
- `Lead.notes` stays available for quick summary text.
- `LeadNote` supports structured per-lead notes with timestamps.
- `LeadEvent` uses normalized `LeadEventType` values for an auditable activity timeline.

## Feedback capture
- Feedback is stored in `FeedbackEntry` for manual QA and product iteration.
- Capture shape: 1-5 `rating`, optional `category`, optional `comments`, optional `leadId`, and source `channel`.
- Docs: [`docs/feedback-capture.md`](docs/feedback-capture.md)

## Draft review workflow
- Draft review should stay human-controlled even when generation gets faster.
- `lib/draftWorkflow.ts` provides `createDraft`, `approveDraft`, `editDraft`, and `rejectDraft` helpers for a strict pending -> approved/rejected revision flow.
- Editing a draft preserves lineage by superseding the prior revision and creating a fresh pending version (`draft-id-v2`, etc.).
- Rejections require a reason so manual QA and future coaching have an auditable explanation.
- Each revised draft now keeps both `supersedesId` and `supersededById`, so draft history can be reconstructed from any revision for operator review.
- `draftHistory()` and `currentDraftRevision()` expose that lineage for future UI/history rendering without guessing which revision is current.

## Environment variables
- See `.env.example` for the template
- Full reference: [`docs/environment-variables.md`](docs/environment-variables.md)
- Minimum local values: `DATABASE_URL` and `SEND_MODE=manual`
- AI provider keys are optional and only needed for draft-generation testing
- Feedback defaults: `FEEDBACK_CAPTURE_ENABLED=true` and `FEEDBACK_DEFAULT_CHANNEL=in_app`

## Development workflow
1. Create or claim an issue
2. Branch from `agent/sales-copilot-mvp-scaffold`
3. Implement one scoped slice
4. Add/update tests where applicable
5. Open a PR to the intended integration branch

## Beta launch checklist
- [ ] Lead CRUD
- [ ] Pipeline/status tracking
- [ ] Queue UI and next-action logic
- [ ] Draft generation + review workflow
- [ ] Manual QA checklist
- [ ] Deployment and environment docs
- [ ] CSV import path validated with sample data

## Demo script
1. Start app and seed demo data
2. Show dashboard and pipeline stage movement
3. Pick a stale lead and generate a follow-up draft
4. Edit + approve draft in manual mode
5. Show timeline/audit trail and queue reprioritization
6. Import a short CSV and verify new leads appear

## Deployment
See [`docs/deployment.md`](docs/deployment.md) for production-safe deployment steps and post-deploy checks.

## Non-goals (for now)
- Fully autonomous outbound sending
- Production secrets in repo
- Direct-to-main release flow

## Contributing
Internal repo for Raul projects. Keep PRs scoped, reversible, and documented.
