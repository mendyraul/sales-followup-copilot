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
Feedback is stored in `FeedbackEntry` for manual QA and product iteration.

### Capture flow
1. Collect a 1-5 `rating` after a follow-up suggestion is reviewed.
2. Optionally include `category` (`ux`, `quality`, `bug`, `other`) and `comments`.
3. Save through Prisma into `FeedbackEntry` with optional `leadId` linkage.

### Env vars for feedback
- `FEEDBACK_CAPTURE_ENABLED` (default `true`) enables writes.
- `FEEDBACK_DEFAULT_CHANNEL` (default `in_app`) tags source channel.

Example payload:
```json
{
  "leadId": "clx123...",
  "rating": 4,
  "category": "quality",
  "comments": "Draft was solid but too long",
  "channel": "in_app"
}
```


## Feedback

- Feedback capture process: `docs/feedback-capture.md`
