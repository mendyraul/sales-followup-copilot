# Manual QA Checklist

Use this checklist before opening or merging a release PR.

## Environment + safety
- [ ] `.env` is configured from `.env.example`
- [ ] `SEND_MODE=manual` is set
- [ ] No production secrets are committed
- [ ] Database is reachable with configured `DATABASE_URL`

## Install + build
- [ ] `npm ci` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run start` boots successfully

## Core product flows
- [ ] Can create a lead
- [ ] Can edit a lead
- [ ] Can archive/delete a lead (if enabled)
- [ ] Lead list/dashboard renders with no runtime errors

## Follow-up workflow
- [ ] A follow-up draft can be generated
- [ ] Approve/edit/reject flow behaves as expected
- [ ] No outbound message is sent automatically in manual mode

## Data + auditability
- [ ] Recent actions appear in timeline/notes (when feature enabled)
- [ ] Feedback capture (if enabled) stores expected values
- [ ] Logs show no unhandled exceptions during QA run

## Final release checks
- [ ] Docs are updated for behavior/config changes
- [ ] Any migrations are included and documented
- [ ] PR description includes test evidence (screenshots/logs/notes)
