# Sales Follow-Up Copilot

Sales Follow-Up Copilot helps small teams track leads, identify the next best follow-up action, and draft personalized outreach safely in **manual-review mode**.

## Current Product Scope (MVP)
- Lead and activity tracking foundation
- Follow-up stage workflow support
- AI-assisted draft generation hooks
- Manual review/approval-first operating model
- Auditability and testability as default behavior

## Tech Stack
- **App:** Next.js + TypeScript
- **Data:** Prisma + PostgreSQL
- **Testing:** Vitest
- **Local infra:** Docker Compose

## Launch Checklist
Before sharing this repo with teammates, complete:
1. Configure environment variables from `.env.example`
2. Start and migrate the database
3. Run tests and basic smoke checks
4. Verify app loads and core flows work locally
5. Confirm `SEND_MODE=manual` for safe launch posture

## Quick Start (Under 3 Minutes)
```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables
| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `SEND_MODE` | Yes | Delivery mode (`manual` recommended/default) |
| `OPENAI_API_KEY` | Optional | Enables AI draft generation if configured |

> Keep secrets out of source control. Use local `.env` only.

## Operational Safety Defaults
- Manual/test mode by default (`SEND_MODE=manual`)
- No live outbound messaging enabled by default
- Human review required before external send behavior is enabled
- Audit logs expected for draft and send actions

## Useful Commands
```bash
npm run dev        # start local app
npm run test       # run test suite
npx prisma studio  # inspect local data
```

## Deployment Notes
- Deploy only after environment variables are configured per target environment.
- Keep production in manual-send mode until explicit go-live review is complete.
- If introducing automated sending, add explicit approval + rollback plan first.

## Roadmap (Open Work)
See GitHub issues for prioritized backlog (feedback capture, docs hardening, QA, CI polish, and release prep).
