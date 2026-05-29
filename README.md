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

## Feedback capture mechanism
- Use `captureFeedback` from `lib/feedback.ts` to store manual reviewer feedback per outbound draft/message.
- Supported types: `positive`, `neutral`, `negative`.
- Minimum required fields: `leadId`, `messageId`, `type`.
- Optional notes are trimmed and stored for follow-up coaching/audit review.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- `SEND_MODE=live` is the only value that enables live sending behavior
- No live email/SMS sending enabled unless explicitly switched to `live`
- No secrets in source control
- Audit logs required for generated/sent actions
