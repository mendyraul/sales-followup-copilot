# Launch Readiness Checklist (Beta)

Use this checklist before sharing the Sales Follow-Up Copilot with a real test user.

## 1) Environment + startup
- [ ] `.env` created from `.env.example`
- [ ] `DATABASE_URL` points to non-production test database
- [ ] `SEND_MODE=manual` is set
- [ ] App starts locally with `npm run dev`
- [ ] `npm test -- --run` passes

## 2) Core workflow smoke test
- [ ] Create a sample lead
- [ ] Edit lead status and save
- [ ] Generate follow-up draft for a lead
- [ ] Approve/edit/reject flow works manually
- [ ] Timeline/notes update persists correctly

## 3) Safety + compliance checks
- [ ] No live outbound sending path enabled
- [ ] No secrets committed (`git status`, `.env` untracked)
- [ ] Manual/test mode defaults are documented in README
- [ ] Audit trail or event logging path verified

## 4) Feedback + iteration
- [ ] Capture user feedback from first session
- [ ] Record top 3 friction points
- [ ] Convert each friction point into a GitHub issue
- [ ] Label follow-ups with `priority:p1` if release-blocking

## 5) Release gate
- [ ] All open high-priority bugs triaged
- [ ] PR opened from feature branch for human review
- [ ] CI is green on the PR
- [ ] Human sign-off recorded before merge

If any box in sections 2–3 fails, do **not** treat the build as beta-ready.
