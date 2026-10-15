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
This repo is now a launch-oriented MVP: the core workflow is in place for demo-safe lead intake, prioritization, notes/timeline capture, draft revision history, CSV import, and feedback collection. The remaining launch job is operational polish — validating the happy path, documenting environment/deploy steps, and keeping manual-safe defaults intact.

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
- `phone` (optional)
- `source` (optional)
- `status` (optional, defaults to `new`)

The dashboard now includes a seeded CSV import preview so operators can verify:
- missing required headers before import
- invalid or missing row data
- duplicate lead emails inside the same file
- status normalization before database writes

The dashboard also includes a seeded first follow-up draft preview in `mock` mode so operators can review subject/body output, normalized review context, explicit fallback warnings, and the manual-review checklist without enabling live delivery.

## Manual QA checklist
Use the full runbook in [`docs/manual-qa.md`](docs/manual-qa.md). Quick checkpoints:
- [ ] App starts locally (`npm run dev`) without runtime errors.
- [ ] Lead list/dashboard loads with demo data.
- [ ] Queue ordering, timeline history, audit log, and draft revision history match the seeded operator flow.
- [ ] First follow-up draft preview shows mock/manual-safe output, normalized review context, fallback warnings, and the review checklist.
- [ ] CSV preview shows valid rows, blocked rows, and duplicate warnings before import.
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
- Feedback triage now includes an escalation snapshot so reviewers can spot urgent notes and the oldest unresolved item before the next demo

## Stale lead detection
- `detectStaleLeads()` evaluates leads against a configurable inactivity window
- Paused and closed leads are intentionally excluded from stale alerts
- Leads with no contact history are flagged immediately for manual review

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
- Draft revision lineage for approve/edit/reject review threads
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

## Launch README / operator playbook

### Launch packet
- [`docs/environment-variables.md`](docs/environment-variables.md) for the exact runtime contract and manual-safe defaults
- [`docs/deployment.md`](docs/deployment.md) for deploy/rollback steps and post-deploy smoke checks
- [`docs/feedback-capture.md`](docs/feedback-capture.md) for collecting structured operator notes after each draft review
- [`docs/manual-qa.md`](docs/manual-qa.md) for the fuller QA walkthrough beyond the checklist below

### What this MVP ships
- queue-first lead review for stale and hot follow-up candidates
- AI-assisted draft generation that stays human-reviewed by default
- timeline, notes, and audit visibility for manual-safe operations
- local demo/test flows that do not require production credentials

### Launch goals
This branch is intended to be demoable and testable without enabling live outbound messaging. The success condition is a human operator being able to review leads, generate/edit drafts, and verify history/audit behavior locally before any promotion step.

### Launch readiness checklist

#### Environment
- [ ] `.env` copied from `.env.example`
- [ ] `docker compose up -d db` succeeds
- [ ] `npx prisma migrate dev --name init` succeeds
- [ ] `npm run dev` boots locally

#### Validation
- [ ] `npm test -- --run` passes
- [ ] `npm run build` passes
- [ ] Dashboard loads with demo or imported lead data

#### Operator flow
- [ ] Queue shows stale/hot leads in expected order
- [ ] Draft generation works in manual/test mode
- [ ] Edit / approve / reject flow remains human-controlled
- [ ] Notes, timeline, and audit surfaces render expected context
- [ ] No live provider is enabled by default

### Fast launch commands
```bash
npm ci
cp .env.example .env
docker compose up -d db
npx prisma migrate dev --name init
npm run db:seed
npm test -- --run
npm run build
npm run dev
```

### Recommended launch walk-through
1. Run the automated checks first:
   ```bash
   npm test -- --run
   npm run build
   ```
2. Start the app locally with `npm run dev`.
3. Smoke-test the operator flow:
   - review the queue ordering
   - inspect lead notes/timeline context
   - generate a draft in manual mode
   - edit, approve, or reject without enabling live send
4. Confirm audit/history output matches the action taken.
5. Record any missing behavior before merging or promoting the branch.

### Manual QA focus
- queue prioritization and stale/hot lead grouping
- prompt quality and manual-safe wording
- timeline/history visibility for per-lead context
- audit coverage for operator-visible actions
- local-only behavior when credentials are absent

### Common launch blockers and fast fixes
- `PrismaClientInitializationError` or connection failures: make sure `docker compose up -d db` is running and `DATABASE_URL` in `.env` still matches `.env.example`.
- Empty dashboard after boot: run `npm run db:seed` or import a starter CSV before validating queue/timeline behavior.
- Draft generation seems unavailable: keep `SEND_MODE=manual`, then set `AI_PROVIDER=mock` for local smoke tests so draft review stays manual-safe.
- `npm run build` fails after schema changes: rerun `npx prisma migrate dev --name init` (or your latest migration) so generated Prisma artifacts match the schema.
- CSV import rejects rows: compare the file headers with the `CSV lead import` section above before retrying.

### Release evidence to capture
- Save the exact commit SHA or PR link used for the demo or launch candidate.
- Record whether the session used seeded leads, imported CSV data, or both.
- Note the active runtime values for `SEND_MODE`, `AI_PROVIDER`, and `FEEDBACK_CAPTURE_ENABLED`.
- Capture whether queue ordering, draft review, notes/timeline, audit log, and feedback capture all passed the smoke test.
- Log any blocker that required operator override instead of leaving it implicit in chat or memory.

### Pilot session script
1. Confirm the environment is still manual-safe before sharing the screen:
   - `SEND_MODE=manual`
   - `AI_PROVIDER=mock` unless a reviewed real-provider dry run is intentional
2. Walk one lead from queue selection through draft review:
   - explain why the lead appears where it does
   - show the timeline and notes context
   - generate a draft, then edit or reject it as a human operator
3. Capture structured feedback immediately after the review so the next pass has concrete operator notes.
4. End by logging what passed, what felt awkward, and which follow-up issue should be filed before beta rollout.

### Launch stop / no-go triggers
- Stop the session if `SEND_MODE=live` appears unexpectedly or cannot be explained.
- Stop if queue ordering or lead context looks inconsistent with the seeded/imported data.
- Stop if draft review actions do not produce matching audit or timeline evidence.
- Stop if the operator needs to bypass the documented setup flow just to reach the happy path.

### Handoff template
Use this as the minimum launch or demo handoff note:

```md
- Candidate: <commit sha or PR>
- Lead data source: <seeded | imported CSV | both>
- Runtime: SEND_MODE=<value>, AI_PROVIDER=<value>, FEEDBACK_CAPTURE_ENABLED=<value>
- Validated flow: <queue review -> notes/timeline -> draft review -> feedback capture>
- Result: <go | no-go>
- Follow-ups: <issues or blockers>
```

### Operator sign-off notes
Capture these checkpoints before asking for review or merge:
- which demo path you validated (seeded data, imported CSV, or both)
- whether draft review stayed in manual/mock mode for the whole session
- any queue, timeline, or feedback gaps still worth filing before beta promotion

## Testing
```bash
npm test -- --run
```

Useful targeted regression commands:
```bash
npm test -- --run src/tests/queue.test.ts src/tests/operator-workflow.test.tsx
npm run build
```
Current automated coverage includes:
- runtime safety defaults for `SEND_MODE`
- feedback normalization and validation paths
- draft revision lineage recovery, including broken/cyclic chain guards
- OpenAI draft parsing guardrails for schema/template placeholder fallbacks

Core focus areas still to expand:
Launch validation stack:
- unit tests for queueing, feedback capture, runtime safety, and workflow helpers
- manual QA for end-to-end lead handling and draft review behavior
- production build check before every PR

Core focus areas:
- status transitions
- follow-up sequence logic
- queue prioritization, including stale-vs-fresh ordering within the same status bucket
- exclusion of won/lost leads from the operator queue
- stale/hot lead detection
- CSV import parsing/preview validation
- feedback normalization, summary metrics, and seeded inbox review flow
- notes/timeline helpers plus seeded operator-history coverage
- audit-log coverage and seeded operator workflow regressions
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
- The dashboard now renders seeded per-lead note previews plus newest-first timeline events so manual QA can verify history without touching live outbound flows.

## Audit log
- `AuditLog` is the canonical persistence model for operator-visible action history.
- The MVP dashboard now includes a lightweight audit timeline seeded with lead, draft, feedback, and safety-mode events.
- This keeps manual QA and future compliance work grounded in visible, reviewable history before any live sending mode is introduced.

## Feedback capture
- Feedback is stored in `FeedbackEntry` for manual QA and product iteration.
- The dashboard now includes a seeded feedback inbox plus summary metrics so reviewers can see draft-quality, UX, and bug feedback in the same manual-safe workspace.
- Negative or low-score feedback is also promoted into a lightweight follow-up queue so operators can triage the riskiest items before the next demo.
- Capture shape: category, sentiment, freeform message, optional 1-5 score, optional `leadId`, source channel, and structured metadata.
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
- Every generated draft returns a human review checklist plus normalized review-context metadata before outbound delivery.

## Environment variables
- See `.env.example` for the template
- Full reference: [`docs/environment-variables.md`](docs/environment-variables.md)
- Manual QA runbook: [`docs/manual-qa.md`](docs/manual-qa.md)
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
See [`docs/deployment.md`](docs/deployment.md) for the full manual-safe rollout runbook. Quick release path:

1. Keep `SEND_MODE=manual` in the target environment.
2. Run `npm ci`, `npm test -- --run`, and `npm run build` on the release candidate.
3. Apply schema changes with `npx prisma migrate deploy`.
4. Start the app, then smoke-test `/` for queue metrics, audit log, timeline cards, manual QA coverage, and the CSV preview.
5. Keep the previous good branch/artifact ready so rollback is one command, not a scramble.

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
