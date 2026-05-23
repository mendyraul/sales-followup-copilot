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

## Feedback Capture Mechanism (Issue #29)

The MVP now includes a first-class `Feedback` model linked to each `Lead`.

### What is captured
- `source`: where the feedback came from (`MANUAL`, `EMAIL_REPLY`, `CALL_NOTE`, `MEETING_NOTE`)
- `sentiment`: quick triage (`NEGATIVE`, `NEUTRAL`, `POSITIVE`)
- `message`: raw feedback text
- `actionable`: whether a follow-up action is required
- `createdAt`: immutable audit timestamp

### Why this is safe/useful
- No outbound messaging is triggered.
- Capture is manual-safe and audit-friendly.
- Indexes support timeline + follow-up workflows.

### Apply migration locally
```bash
npx prisma migrate dev --name add_feedback_capture
```
