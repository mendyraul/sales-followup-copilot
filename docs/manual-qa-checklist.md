# Manual QA Checklist

Use this checklist before merging features or shipping to production.

## 1) Environment & Setup
- [ ] `.env` exists and required vars are set (`DATABASE_URL`, auth/session vars, AI provider vars if enabled)
- [ ] `npm install` succeeds without errors
- [ ] Database is reachable and migrations are up to date (`npx prisma migrate deploy`)
- [ ] App starts successfully (`npm run dev`)

## 2) Core Lead Workflow
- [ ] Create a new lead with required fields
- [ ] Edit an existing lead and save updates
- [ ] Change lead stage/status and confirm persistence after refresh
- [ ] Delete/archive a lead (if supported) and confirm expected behavior

## 3) Follow-up Workflow
- [ ] Generate a follow-up draft for a lead
- [ ] Review/edit the draft text
- [ ] Approve or reject draft action path (if enabled)
- [ ] Confirm timeline/notes update correctly after follow-up actions

## 4) Data Quality & Safety
- [ ] Validation errors appear for bad/missing input
- [ ] No sensitive secrets are rendered in UI or logs
- [ ] Duplicate lead handling behaves as expected
- [ ] Date/time and next-action calculations are sensible

## 5) CSV / Import / Export (if enabled)
- [ ] CSV import accepts valid sample file
- [ ] Invalid CSV rows surface clear errors
- [ ] Imported leads appear correctly in dashboard/list

## 6) Test & CI Sanity
- [ ] `npm test` passes locally
- [ ] Lint/type checks pass (if configured)
- [ ] GitHub Actions CI passes on PR

## 7) Browser Smoke Test
- [ ] Chrome/Chromium latest
- [ ] Firefox latest
- [ ] Mobile viewport quick smoke (responsive layout, no critical breakage)

## 8) Release Readiness
- [ ] README setup steps still match current behavior
- [ ] New feature documented (README/docs)
- [ ] Rollback plan identified (previous image/build or revert PR)

---

## Suggested test seed scenario
Create at least 3 leads:
1. **Hot lead** with recent inbound interest
2. **Stale lead** with no activity for 14+ days
3. **New lead** with minimal data

Run follow-up generation and status transitions on each to validate edge cases.
