# Deployment Guide

This project is designed for **safe/manual operation by default**. Use this runbook to ship a new build without enabling live outbound messaging. Success means the dashboard, queue, timeline, audit trail, CSV preview, and feedback workflow all remain operator-visible and reversible after deploy.

## Deployment principles
- Keep `SEND_MODE=manual` for normal staging and production rollout.
- Treat the dashboard (`/`) as the primary smoke-test surface after every release.
- Promote stacked branches deliberately and record the last known-good commit before advancing.
- Never commit production secrets or platform-generated `.env` files.
- Separate deployment from any future decision to enable live outbound behavior.

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Access to the target environment's secret manager or env-var settings

## Environment configuration
Create the target `.env` or platform env-var set from `.env.example`.

Minimum values:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `SEND_MODE=manual`
- `AI_PROVIDER=mock` for the safest default, or `AI_PROVIDER=openai` with a provider key only when real draft-generation validation is explicitly required
- `FEEDBACK_CAPTURE_ENABLED=true` unless you intentionally want to suppress QA feedback writes

Recommended manual-safe launch posture:

```env
SEND_MODE=manual
AI_PROVIDER=mock
FEEDBACK_CAPTURE_ENABLED=true
FEEDBACK_DEFAULT_CHANNEL=in_app
```

If the real provider is used, add the matching API key through the platform secret store. Never switch to `SEND_MODE=live` as part of a normal deploy. That must remain a separate, explicitly approved change.

## Release preflight
Run this before touching the integration branch or production target:

```bash
npm ci
npm test -- --run
npm run build
```

If any step fails, stop. Do not continue with a partial or "probably fine" release candidate.

## Database rollout
Run migrations before promoting the new app build:

```bash
npx prisma migrate deploy
```

Optional but useful after dependency or schema changes:

```bash
npx prisma generate
```

What this protects:
- lead status and queue flows
- timeline and structured note history
- audit-log coverage
- feedback capture
- CSV import persistence paths once they move beyond preview mode

## Local release rehearsal
For a prod-like local validation pass:

```bash
cp .env.example .env
docker compose up -d db
npm ci
npx prisma migrate deploy
npm test -- --run
npm run build
npm run start
```

Use this when you want to rehearse the exact operator flow before a hosted deploy.

## Platform release notes
- Set the same env vars in the platform UI or secret store; do not rely on checked-in files.
- Run `prisma migrate deploy` as part of the release command or a pre-start hook.
- Keep `SEND_MODE=manual` or `SEND_MODE=test` until explicit human approval to go live.
- Preserve logs long enough to review queue, audit, feedback, and draft-related issues after deployment.

## Post-deploy smoke checklist
After the app is live, verify:
- `/` loads without runtime errors
- the Safety mode card still shows `manual`
- queue metrics render with seeded/demo data or the target environment's expected dataset
- the Recent audit log section renders recent activity
- lead timeline cards still show notes and newest-first events
- manual QA coverage and deployment readiness sections are visible
- the CSV preview section renders valid rows, blocked rows, and duplicate warnings
- feedback capture and escalation surfaces still render for manual review
- no secrets appear in logs, the UI, or error pages

## Release evidence to capture
Record these artifacts in the issue, PR, or handoff note for every deploy candidate:
- commit SHA or branch name deployed
- output from `npm test -- --run`
- output from `npm run build`
- confirmation that `npx prisma migrate deploy` succeeded
- confirmation that `/` rendered in manual-safe mode after deploy
- any remaining operator-visible gaps discovered during the smoke pass

## Rollback plan
Before promoting the next slice:
- record the current good branch or commit SHA
- keep the previous deployment artifact or image tag available
- if the release breaks dashboard smoke checks, redeploy the previous known-good artifact first and debug afterward

For stacked PRs, rollback is usually easiest by redeploying the last known-good base branch rather than attempting a rushed multi-slice revert while the app is unhealthy.

## Current MVP limits
This runbook intentionally assumes:
- manual review remains the product boundary
- demo and seeded workflows are still part of QA and operator validation
- live outbound delivery is not a default capability
- deployment success means the dashboard and safety rails work, not that autonomous outreach is enabled
