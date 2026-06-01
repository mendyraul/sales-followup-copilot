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

## Launch readiness checklist

### 1) Pre-launch setup
- [ ] `npm ci` completes successfully
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npx prisma migrate deploy` runs cleanly against target DB
- [ ] Production env vars are set and validated

### 2) Manual QA smoke pass
- [ ] Create a new lead and verify it appears in lead list
- [ ] Update lead status and verify timeline/audit event is created
- [ ] Generate a follow-up draft and verify content renders correctly
- [ ] Confirm manual approval step is required before any send flow
- [ ] Verify dashboard counters update after lead/status changes

### 3) Production safety checks
- [ ] `SEND_MODE=manual` confirmed in production
- [ ] No test/demo data present in production DB
- [ ] Error logs and request logs are visible in deployment platform
- [ ] Rollback target (previous deploy) is available

## Rollback plan
1. Revert to previous deployment in hosting platform.
2. If schema changed, run backward-compatible remediation migration.
3. Verify app health and core lead workflow after rollback.
4. Post incident summary with root cause and preventive action.

## Known beta limitations
- Auth and tenant isolation are not production-hardened yet.
- Messaging integrations are intentionally kept in manual mode.
- Queue/worker durability is still MVP-level and needs hardening.
