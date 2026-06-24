# AI Sales Follow-Up Copilot

Manual-safe MVP for managing sales leads and drafting AI-assisted follow-up messages with explicit manual, test, and live runtime modes.

## Why this exists
Small teams lose deals when follow-ups are inconsistent. This project provides a structured queue, suggested next actions, and editable message drafts so humans can move faster while staying in control.

## MVP goals
- Capture and manage leads in one place
- Track follow-up state, timeline history, and structured lead notes
- Generate first-draft outreach content for human review
- Keep strict manual/test safeguards as the default

## Launch snapshot
This repo is now a launch-oriented MVP: the core workflow is in place for demo-safe lead intake, prioritization, notes/timeline capture, CSV import, and feedback collection. The remaining launch job is operational polish — validating the happy path, documenting environment/deploy steps, and keeping manual-safe defaults intact.

## Who this is for
- Founder-led or small sales teams who need a simple follow-up cockpit
- Operators who want AI-assisted drafting without auto-sending
- Early demos/pilots where auditability and reversible workflows matter more than automation volume

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
- [ ] Outbound actions remain blocked unless `SEND_MODE=live` is intentionally enabled.
- [ ] No secrets are printed in logs or committed to git.

## Safety-first defaults
- `SEND_MODE=manual` by default
- `SEND_MODE=test` is available for explicit dry-run/integration validation without live delivery
- `SEND_MODE=live` is the only value that enables live sending behavior
- No live email/SMS sending enabled unless explicitly switched to `live`
- No production credentials required for local development
- Drafts are intended for approve/edit/reject workflow
- No secrets in source control
- Audit logs are expected for generated/sent actions
- Home dashboard now shows a lightweight audit trail for lead, draft, feedback, and safety-mode events

## Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Launch-ready workflow
1. Seed or import leads into the app
2. Review the queue for stale and high-priority follow-ups
3. Open a lead, add notes, and review timeline context
4. Draft a follow-up in mock/manual-safe mode
5. Capture operator feedback after the interaction
6. Repeat without enabling live delivery

## What is already in the MVP
- Lead CRUD with Prisma-backed persistence
- Queue ordering with next-action guidance
- Follow-up stage modeling and visual workflow context
- Hot-lead and stale-lead detection
- Structured timeline and per-lead notes
- CSV import for bulk lead seeding
- In-app/manual feedback capture for iteration
- Environment and deployment docs for local-to-hosted setup

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

## Launch checklist
Before sharing this with a real user or pilot customer, verify:

- [ ] `.env` is populated from `.env.example` with non-production secrets only
- [ ] `SEND_MODE=manual` remains the default everywhere
- [ ] Demo/seed data loads cleanly or a sample CSV import succeeds
- [ ] Queue, stale/hot flags, and next-action guidance render without runtime errors
- [ ] Lead notes, timeline, and feedback capture persist correctly
- [ ] Manual QA checklist in `docs/manual-qa-checklist.md` is completed
- [ ] Deployment/env docs match the actual runtime setup
- [ ] No outbound integrations are silently enabled

## Testing
```bash
npm test -- --run
```

Current automated coverage includes:
- runtime safety defaults for `SEND_MODE`
- feedback normalization and validation paths

Core focus areas still to expand:
Launch validation stack:
- unit tests for queueing, feedback capture, runtime safety, and workflow helpers
- manual QA for end-to-end lead handling and draft review behavior
- production build check before every PR

Core focus areas:
- status transitions
- follow-up sequence logic
- queue prioritization
- stale lead detection
- hot lead prioritization
- opt-out safety checks
- future-timestamp clamping and closed-lead queue exclusion

## Pilot operator flow
Use this script for a first demo or soft launch:
1. Start the app and seed demo data
2. Show the queue and explain why leads are ordered that way
3. Open one stale lead and one hot lead to compare urgency
4. Add a note, move the lead to the next follow-up stage, and review the timeline
5. Draft the next outreach message in manual mode
6. Capture operator feedback on whether the suggestion was useful
7. End by showing that live sending still requires an explicit opt-in

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

## Audit log
- `AuditLog` is the canonical persistence model for operator-visible action history.
- The MVP dashboard now includes a lightweight audit timeline seeded with lead, draft, feedback, and safety-mode events.
- This keeps manual QA and future compliance work grounded in visible, reviewable history before any live sending mode is introduced.

## Feedback capture
- Feedback is stored in `FeedbackEntry` for manual QA and product iteration.
- Capture shape: 1-5 `rating`, optional `category`, optional `comments`, optional `leadId`, and source `channel`.
- Docs: [`docs/feedback-capture.md`](docs/feedback-capture.md)

## AI provider abstraction
- `lib/aiProvider.ts` is the single adapter entry point for draft generation.
- `mock` is the safe default and returns deterministic local drafts for demos, tests, and manual QA.
- `openai` is supported behind `AI_API_KEY` and keeps provider-specific HTTP wiring out of the rest of the app.
- Future providers should implement the same `AiProvider` contract so routing logic stays isolated.
## Draft review workflow
- Draft review should stay human-controlled even when generation gets faster.
- `lib/draftWorkflow.ts` provides `createDraft`, `approveDraft`, `editDraft`, and `rejectDraft` helpers for a strict pending -> approved/rejected revision flow.
- Editing a draft preserves lineage by superseding the prior revision and creating a fresh pending version (`draft-id-v2`, etc.).
- Rejections require a reason so manual QA and future coaching have an auditable explanation.
- Each revised draft now keeps both `supersedesId` and `supersededById`, so draft history can be reconstructed from any revision for operator review.
- `draftHistory()` and `currentDraftRevision()` expose that lineage for future UI/history rendering without guessing which revision is current.

## First follow-up draft generation
- `lib/firstFollowupDraft.ts` builds the first-touch follow-up payload from lead context, desired next step, and tone.
- `lib/followupPromptTemplate.ts` centralizes the reusable prompt template so provider adapters keep the same manual-safe constraints and output contract.
- The helper routes through `lib/aiProvider.ts`, so `AI_PROVIDER=mock` stays the deterministic/manual-safe default for demos and QA.
- Every generated draft returns a human review checklist before outbound delivery.

## Environment variables
- See `.env.example` for the template
- Full reference: [`docs/environment-variables.md`](docs/environment-variables.md)
- Minimum local values: `DATABASE_URL` and `SEND_MODE=manual`
- Use `SEND_MODE=test` only when you want explicit non-live validation behavior beyond the default manual mode
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
- [ ] Hot-lead flags and review lane
- [x] Follow-up sequence stages with draft/review/send guidance
  - priority lanes split work into act-now / queue-next / warm-up buckets for manual triage
- [ ] Draft generation + review workflow
- [ ] Manual QA checklist
- [ ] Deployment and environment docs
- [ ] CSV import path validated with sample data

## Demo script
1. Start app and seed demo data
2. Show dashboard and pipeline stage movement
3. Pick a stale lead flagged on the dashboard and generate a follow-up draft
4. Edit + approve draft in manual mode
5. Show timeline/audit trail and queue reprioritization
6. Import a short CSV and verify new leads appear

## Deployment
See [`docs/deployment.md`](docs/deployment.md) for production-safe deployment steps and post-deploy checks.

Recommended launch order:
1. Validate locally with seed data and manual QA
2. Deploy to a private/staging environment
3. Re-run the manual QA checklist against staging
4. Confirm environment variables and database connectivity
5. Keep `SEND_MODE=manual` through the first pilot round

## Related docs
- [Environment variables](docs/environment-variables.md)
- [Deployment guide](docs/deployment.md)
- [Feedback capture](docs/feedback-capture.md)
- [Manual QA checklist](docs/manual-qa-checklist.md)

## Non-goals (for now)
- Fully autonomous outbound sending
- Production secrets in repo
- Direct-to-main release flow

## Contributing
Internal repo for Raul projects. Keep PRs scoped, reversible, and documented.
