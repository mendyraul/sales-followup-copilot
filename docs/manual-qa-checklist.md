# Manual QA Checklist

Use this checklist before merging PRs or deploying any release candidate.

## 1) Environment + startup
- [ ] `.env` exists and includes all required variables from `.env.example`
- [ ] `SEND_MODE=manual`
- [ ] `docker compose up -d db` succeeds
- [ ] `npx prisma migrate dev` (local) or `npx prisma migrate deploy` (deploy path) succeeds
- [ ] `npm run dev` starts without runtime errors

## 2) Lead management flows
- [ ] Create a lead with required fields
- [ ] Edit lead values (name, company, email, status)
- [ ] Delete lead and verify it no longer appears in lead lists
- [ ] Search/filter lead list and verify expected results

## 3) Follow-up workflow safety
- [ ] Generate follow-up draft for at least one lead
- [ ] Verify draft is stored and retrievable from history/timeline
- [ ] Confirm approve/edit/reject workflow behaves correctly
- [ ] Confirm no outbound send occurs automatically while in manual mode

## 4) Auditability
- [ ] Verify audit log entry is created for draft generation
- [ ] Verify audit log entry includes actor, timestamp, and action type
- [ ] Verify audit log entry is created for approve/edit/reject actions

## 5) Regression + quality gates
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] No secrets or `.env` files are staged in git
- [ ] README deployment/safety notes still match app behavior

## 6) Sign-off
- [ ] QA run timestamp recorded
- [ ] Tester initials recorded
- [ ] Blocking issues captured as GitHub issues with repro steps
