# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

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

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Feedback capture mechanism
Use `FeedbackEvent` records to capture operator or lead feedback tied to a draft, send attempt, or lead lifecycle step.

Suggested API contract:
- `POST /api/feedback`
  - body: `{ leadId?, channel, category, sentimentScore?, message, metadata? }`
- `GET /api/feedback?leadId=<id>`
  - returns newest-first feedback timeline for QA and iteration.

Recommended categories:
- `draft_quality`
- `tone_mismatch`
- `wrong_timing`
- `positive_outcome`
- `other`

This keeps product learning auditable and avoids direct model retraining paths in MVP.
