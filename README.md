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


## Feedback Capture Mechanism

This project stores user feedback per lead in a dedicated `FeedbackEntry` model.

- `source`: where feedback came from (`IN_APP`, `EMAIL`, `CALL`, `MANUAL`)
- `sentiment`: normalized sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`)
- `rating`: optional 1-5 score
- `summary`: required short summary
- `actionItems`: optional follow-up notes

### Suggested write flow

1. Resolve the target `Lead` record.
2. Create a `FeedbackEntry` with `leadId`, `summary`, and optional sentiment/rating.
3. Surface latest entries in the lead timeline for manual review.

### Example payload

```json
{
  "leadId": "clx123...",
  "source": "EMAIL",
  "sentiment": "POSITIVE",
  "rating": 5,
  "summary": "Prospect confirmed budget and requested final proposal.",
  "actionItems": "Send revised proposal by Friday."
}
```
