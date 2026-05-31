# Manual QA Checklist (Issue #25)

Use this checklist before opening or updating a PR for beta-readiness tasks.

## 1) Environment & Setup
- [ ] `cp .env.example .env.local` completed
- [ ] `DATABASE_URL` points to local/test DB (never production)
- [ ] `npm ci` succeeds without dependency errors
- [ ] `npm run prisma:generate` succeeds
- [ ] `npm run prisma:migrate` succeeds

## 2) App Boot & Basic Health
- [ ] `npm run dev` starts successfully
- [ ] App is reachable at `http://localhost:3000`
- [ ] No startup exceptions in terminal logs

## 3) Core Safety Controls
- [ ] Manual/test mode is enabled by default
- [ ] No outbound production messaging is triggered automatically
- [ ] Any send action requires explicit user confirmation

## 4) Primary User Flow Smoke Test
- [ ] Create a lead/contact record successfully
- [ ] Edit existing lead/contact record successfully
- [ ] Status/stage updates persist after refresh
- [ ] Follow-up draft generation (if enabled in scope) works in mock/manual mode

## 5) Data Integrity Checks
- [ ] Required fields are validated with clear error messages
- [ ] Invalid input is rejected safely
- [ ] No silent failures (errors are visible/logged)

## 6) Regression & Build Checks
- [ ] `npm test` (or equivalent) passes for available tests
- [ ] `npm run lint` passes (if configured)
- [ ] `npm run build` passes (if configured)

## 7) Security & Compliance Guardrails
- [ ] No secrets/API keys committed
- [ ] `.env*` files remain ignored by git
- [ ] No direct push to `main`

## 8) PR Readiness
- [ ] PR description includes what changed and why
- [ ] PR includes manual QA evidence (commands + outcomes)
- [ ] Any known limitations are documented

---

## QA Evidence Template (paste into PR)

```txt
Environment: <local machine / container>
Branch: <feature/...>

Commands run:
- npm ci
- npm run prisma:generate
- npm run prisma:migrate
- npm test
- npm run lint
- npm run build

Outcomes:
- <pass/fail summary>
- <notes on warnings, skips, or blockers>
```
