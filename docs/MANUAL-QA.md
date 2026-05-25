# Manual QA Checklist

Use this checklist before opening or updating a release PR.

## 1) Bootstrap and Smoke Test
- [ ] `cp .env.example .env`
- [ ] `docker compose up -d db`
- [ ] `npm install`
- [ ] `npx prisma migrate dev --name qa_check`
- [ ] `npm run dev`
- [ ] Home page loads at `http://localhost:3000`

## 2) Lead Management
- [ ] Create a new lead with name, company, email, and phone
- [ ] Edit an existing lead and confirm values persist after refresh
- [ ] Move lead across stages (`new` → `contacted` → `replied`)
- [ ] Mark one lead as `hot` and one as `lost`

## 3) Follow-Up Draft Workflow (Manual-Safe)
- [ ] Confirm `SEND_MODE=manual`
- [ ] Generate a follow-up draft for one lead
- [ ] Edit draft content before approval
- [ ] Approve one draft and reject another
- [ ] Confirm no live outbound send is triggered automatically

## 4) Queue and Prioritization
- [ ] Verify stale lead appears in next-action queue
- [ ] Verify hot lead is prioritized above non-urgent leads
- [ ] Complete one queue action and verify queue refreshes correctly

## 5) Timeline and Audit
- [ ] Add a note to a lead timeline
- [ ] Confirm timeline order is newest-first
- [ ] Verify audit log entry for draft generation
- [ ] Verify audit log entries for approve/reject decisions

## 6) CSV Import
- [ ] Import a valid CSV with at least 3 leads
- [ ] Verify imported leads appear with expected fields
- [ ] Import one malformed CSV row and confirm graceful handling

## 7) Regression Checks
- [ ] `npm test` passes
- [ ] `npm run lint` passes (if configured)
- [ ] No secrets in staged changes (`git diff --staged` review)

## Exit Criteria
Mark QA complete only when all relevant checks pass and any skipped checks are documented in the PR description.
