# Deployment Guide

This project is designed for **safe/manual operation by default**. Use this guide to deploy without enabling live outbound messaging. The current MVP assumes humans are still reviewing queue changes, timeline history, CSV imports, and any AI-assisted draft output before anything customer-facing happens.

## 1) Deployment principles
- Keep `SEND_MODE=manual` for normal staging and production rollout.
- Treat the dashboard (`/`) as the primary smoke-test surface: queue metrics, audit log, timeline cards, manual QA coverage, deployment readiness, and CSV preview should all render after deploy.
- Promote stacked branches deliberately. Record the current good branch or commit before advancing to the next slice.
- Never commit production secrets or platform-generated `.env` files.

## 2) Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Access to the target environment's secret manager / env-var settings

## 3) Environment configuration
Create the target `.env` or platform env-var set from `.env.example`. Minimum values:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `SEND_MODE=manual`
- `AI_PROVIDER=mock` for the safest default, or `AI_PROVIDER=openai` with `AI_API_KEY` if draft-generation testing needs the real provider
- `FEEDBACK_CAPTURE_ENABLED=true` unless you intentionally want to suppress QA feedback writes

Recommended manual-safe launch posture:

```env
SEND_MODE=manual
AI_PROVIDER=mock
FEEDBACK_CAPTURE_ENABLED=true
FEEDBACK_DEFAULT_CHANNEL=in_app
```

> Never switch to `SEND_MODE=live` as part of a normal deploy. That should be a separate, explicitly approved change.

## 4) Database rollout
Run migrations before promoting the new app build:

```bash
npx prisma migrate deploy
```

Optional but useful:

```bash
npx prisma generate
```

What this protects:
- lead status / queue flows
- timeline and structured note history
- audit-log coverage
- feedback capture
- CSV import persistence paths once they move beyond preview mode

## 5) Build + release steps
For a standard Node deployment:

```bash
npm ci
npm test -- --run
npm run build
npm run start
```

If the release candidate fails tests or build, stop there. Do **not** continue by hand-waving the failure away.

## 6) Docker Compose / prod-like local validation
For a local release rehearsal:

```bash
cp .env.example .env
docker compose up -d db
npm ci
npx prisma migrate deploy
npm test -- --run
npm run build
npm run start
```

## 7) Post-deploy smoke checklist
After the app is live, verify:
- `/` loads without runtime errors
- the Safety mode card still shows `manual`
- queue metrics render with seeded/demo data or the target environment's expected dataset
- the Recent audit log section renders recent activity
- lead timeline cards still show notes + newest-first events
- manual QA coverage and deployment readiness sections are visible
- the CSV preview section renders valid rows, blocked rows, and duplicate warnings
- no secrets appear in logs, the UI, or error pages

## 8) Rollback plan
Before merging or promoting the next stacked branch:
- record the current good branch / commit SHA
- keep the previous deployment artifact or image tag available
- if a release breaks the dashboard smoke checks, redeploy the previous known-good artifact first, then debug

For stacked PRs, rollback is often easiest by redeploying the last known-good base branch rather than trying to revert several slices while the app is unhealthy.

## 9) Platform notes (Vercel / Render / Fly / similar)
- Set the same env vars in the platform UI or secret store; do not rely on checked-in files.
- Run `prisma migrate deploy` as part of the release command or pre-start hook.
- Preserve logs long enough to review queue / audit / draft-related issues after deployment.
- Keep outbound integrations disabled unless a later, separately approved change introduces them.

## 10) Current MVP limits
This deployment runbook intentionally assumes:
- manual review remains the product boundary
- demo/seeded workflows are still part of QA and operator validation
- live outbound delivery is not a default capability
- deployment success means the dashboard and safety rails work, not that autonomous outreach is enabled
