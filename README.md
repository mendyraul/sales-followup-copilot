# Follow Through · Sales Follow-Up Copilot

Free, MIT-licensed follow-up software for consultants and small agencies. Self-host it with PostgreSQL, invite your team, and keep the next action beside the conversation. Templates work without API keys. People review drafts and send them from their own inbox.

## Install

Requires Docker with Compose and Git. From this source checkout:

```sh
sh scripts/install.sh
```

The installer creates private random secrets, builds the app, applies migrations and starts PostgreSQL, the app and a durable worker. Create your first account with a hidden password prompt:

```sh
docker compose -f compose.selfhost.yml exec app npm run account:owner -- --email=you@example.com
```

Open **http://127.0.0.1:3116**. There is no public signup. [Installation, prebuilt images, upgrades and recovery](docs/self-hosting.md).

## What you can do

1. Schedule a next action, snooze it, or complete it; use Today, Overdue, Upcoming and No next action queues.
2. See actual last contact and last reply separately from internal edits and notes.
3. Receive durable in-app reminders and optional SMTP reminders or a daily digest, including retry and uncertain-delivery states.
4. Log a call, email, reply, voicemail or meeting with a note and next task in one mobile-friendly action.
5. Optionally connect Gmail read-only and explicitly share selected threads into a workspace. Replies flag tasks for review. The app never sends prospect mail.
6. Save tone, examples, sign-off and phrases to avoid. Choose draft source notes/messages; inspect saved provenance. Local templates are the default; externally generated drafts require confirmation and operator configuration.
7. Keep people with the same name, review duplicate candidates and CSV matches, and merge histories while retaining old contact links.
8. Export contact CSV or complete credential-free workspace JSON. Preview a restore into a new workspace with fresh IDs and cleared assignments.
9. Invite owners/members, assign contacts, receive handoff notifications and leave work unassigned when someone leaves.
10. Follow a dismissible setup guide, inspect local usage counts and preview feedback before choosing to share it on GitHub.

The queue uses server search, filters and cursor pagination. Notes, activity, feedback and notifications can load older history. Full JSON exports retain domain history, including explicitly shared mail copies; treat exports as private customer data. Accounts, sessions, OAuth tokens and provider secrets are excluded.

## Try a fictional demo

Requires Node **22.12+**, npm and Docker. Use a separate checkout from a running self-hosted build:

```sh
npm ci
npm run demo
```

Open **http://127.0.0.1:3115**. The demo seeds fictional `.example` contacts, forces template drafts and retains its database volume. Demo mode bypasses sign-in and is restricted to loopback; use authenticated self-host mode for real work. Never build into a checkout while it serves `.next`.

## Optional services and privacy

The core app needs no subscriptions, payment details or external telemetry. Configure SMTP only if you want email reminders. Gmail needs your own Google OAuth application and `gmail.readonly` permission; Google may require verification for a public rollout. Google access is per member and selected thread content becomes shared only after confirmation. Optional OpenAI generation shares chosen context after confirmation, has daily request limits and uses `store: false`; provider retention policies still apply. [Configuration](docs/environment-variables.md).

This is an early open-source pilot. We test provider boundaries with fixtures; a real Gmail OAuth application, SMTP relay and AI account must be exercised by the operator before enabling them for a pilot. Hosting is optional and operator-managed; no hosted service or SLA is included.

## Develop and verify

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm audit --audit-level=moderate
npm run build
```

Database integration and browser checks require an isolated PostgreSQL database whose name ends in `_test`. Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters) and `AI_PROVIDER=mock`; then run `npm run db:migrate`, `npm run db:seed`, `npx playwright install chromium` and `npm run test:e2e`. Browser tests start demo and authenticated servers on 3120/3121 and create fictional accounts/records. Never use a real workspace database. [Verification](docs/verification.md), [manual checks](docs/manual-qa.md), [contributing](CONTRIBUTING.md), [security reporting](SECURITY.md).

The application is Next.js/React, Prisma/PostgreSQL, Better Auth and pg-boss. `src/server` enforces workspace access and transactions; `src/domain` contains rules; `prisma/migrations` preserves upgrade history. See [deployment](docs/deployment.md) and [MIT license](LICENSE).
