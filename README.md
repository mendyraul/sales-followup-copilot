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

## Manual QA checklist
- [ ] App starts locally (`npm run dev`) without runtime errors.
- [ ] Lead list/dashboard loads with demo data.
- [ ] Creating and editing a lead works end-to-end.
- [ ] Follow-up draft generation works in `AI_PROVIDER=mock` mode.
- [ ] Outbound actions remain blocked unless `SEND_MODE=manual` is intentionally changed.
- [ ] No secrets are printed in logs or committed to git.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
