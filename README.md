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

`lib/feedback-capture.js` provides a safe normalizer for collecting user feedback from UI/manual/API paths.

- Validates required fields (`issueId`, `message`)
- Restricts source to `ui`, `email`, `manual`, `api`
- Trims content and timestamps each event

```js
const { normalizeFeedback } = require('./lib/feedback-capture')

const feedback = normalizeFeedback({
  issueId: 'lead-1',
  message: 'Customer requested monthly billing',
  source: 'ui'
})
```
