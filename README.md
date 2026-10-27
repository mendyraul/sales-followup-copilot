# Sales Follow-Up Copilot · Follow Through

A working local sales workspace built with Next.js, React, Prisma, and PostgreSQL. Lead changes, notes, draft revisions, decisions, feedback, and audit records are saved in the database. The dashboard reads saved records rather than preview fixtures.

## Run the demo

Requires Node.js **22.12+**, npm, Docker, and a running Docker daemon.

```bash
npm ci
npm run demo
```

Open **http://127.0.0.1:3115**. The demo command creates `.env` from `.env.example` only when missing, starts Postgres, applies committed migrations, adds fictional contacts without overwriting existing contacts, builds the app, and starts it on loopback. It forces the mock draft provider and manual mode for this process. No key or paid API is needed. **Sending is disabled**, including after draft approval.

Stop the app with Ctrl-C. Your data remains in the Docker volume. Restart with `npm run demo`. To stop Postgres without removing data:

```bash
docker compose stop db
```

Ports are 3115 for the app and 5617 for Postgres. Change `PORT`, `DB_PORT`, and the port in `DATABASE_URL` together as needed; `PORT` can be changed independently. If the app port is occupied, the demo exits before rebuilding. Never run a build while another process is serving this checkout's `.next` directory.

## Five-minute walkthrough

1. Select **Summit Home Services** in the pipeline. Hot leads sort first; age raises urgency and the queue marks leads stale after 48 hours. Closed and opted-out leads are excluded from the follow-up queue.
2. Add a note with the latest request. Enter a desired next step and generate a draft. The deterministic mock uses the saved note and lead context.
3. Edit the draft and save a revision. Approve or reject it, then reload the page and select the lead again. Decisions and prior text remain in revision history. Editing an approved draft returns it to review. Approval never sends a message.
4. Add a lead, update its details, and advance its status. Allowed transitions are NEW → CONTACTED/LOST; CONTACTED → REPLIED/HOT/LOST; REPLIED → HOT/WON/LOST; HOT → WON/LOST. WON and LOST are terminal. Opt-out blocks draft generation and approval.
5. Open **Import CSV**, review the preview, and import valid contacts. Open **Activity & feedback** to submit feedback and inspect saved audit events. Delete a lead if desired; its audit record remains.

All seed emails use `.example` domains. Use fictional data for demonstrations.

## Development and checks

```bash
cp .env.example .env  # only for a new environment
npm run db:migrate
npm run db:seed
npm run dev -- --port 3115
```

Start Postgres first with `docker compose up -d --wait db`. `npm run db:seed` adds missing fictional contacts; it does not update existing contacts. To run without adding demo data, skip the seed step. For a production build locally, stop dev, then run `npm run build` and `npm run start -- --port 3115`.

```bash
npm run lint
npm run typecheck
npm test
npm audit --audit-level=moderate
npm run build
```

Browser tests run a production server on port 3120 and create/delete fictional records. Use a **separate test database**; never point them at important data:

```bash
export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5618/sales_followup_test'
export AI_PROVIDER=mock
npm run db:migrate
npm run db:seed
npm run build
npx playwright install chromium
npm run test:e2e
```

Provision the test Postgres separately. CI provides one automatically, checks dependency advisories, runs unit/type/lint/build checks, and exercises real persisted browser workflows and API validation. It uploads browser traces on failure.

## CSV import

The UI previews and imports up to 200 rows atomically. Required columns: `name,email`. Optional columns: `phone,source,status`. Status is case insensitive; quoted commas, newlines, and escaped quotes are supported. Missing/unknown/duplicate headers, bad rows, and duplicate emails block the entire import. Existing email or name conflicts roll back every row. Imports create contacts; they do not overwrite existing leads.

```csv
name,email,phone,source,status
"River, Studio",hello@river.example,,Referral,new
```

The CLI uses the same running local API, validation, transaction, and audit trail:

```bash
npm run import:csv -- ./leads.csv
```

## Structure and operating limits

- `src/app`: responsive dashboard and `/api/workspace` route. GET returns persisted workspace data; JSON POST accepts `createLead`, `updateLead`, `deleteLead`, `addNote`, `generateDraft`, `reviewDraft`, `importCsv`, and `feedback` commands.
- `src/server`: Prisma transactions, input validation, provider orchestration, and audit writes.
- `src/domain` and `lib`: queue/status logic, CSV parser, AI provider contract, prompt template, and domain tests. Historical preview fixtures remain test data and are not used by the dashboard.
- `prisma/migrations`: initial schema and additive draft-revision migration. `prisma/seed.mjs` adds fictional contacts.
- `e2e`: real database browser flows, conflicting review tests, validation, atomic imports, and mobile checks.

This release is a **single-operator local demo**, with no authentication, tenant isolation, email delivery, background scheduling, or CRM sync. Keep it on loopback. Public hosting requires authentication and access controls first. Audit history and revision history are persisted; the dashboard shows the latest 100 audit and feedback entries. Lead deletion removes associated notes/drafts but retains audit records and unlinks feedback.

See [environment variables](docs/environment-variables.md), [deployment and migration](docs/deployment.md), [manual QA](docs/manual-qa.md), and [feedback capture](docs/feedback-capture.md).
