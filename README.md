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

## Manual QA Checklist

Run this checklist before opening or updating a PR:

- [ ] `npm install` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npx prisma validate` passes
- [ ] App boots locally with `npm run dev`
- [ ] Dashboard page renders without runtime errors
- [ ] Lead create/edit/delete flow works end-to-end
- [ ] No real outbound messaging is triggered (test/manual mode only)
- [ ] `.env` values are local/test-safe and no secrets were committed

### Quick Smoke Test

1. Start app: `npm run dev`
2. Open `http://localhost:3000`
3. Create a sample lead with mock contact info
4. Update lead status and notes
5. Delete the sample lead
6. Confirm no errors appear in terminal or browser console
