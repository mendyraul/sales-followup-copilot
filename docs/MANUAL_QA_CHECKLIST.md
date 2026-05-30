# Manual QA Checklist

Use this checklist before opening or merging a release PR.

## 1) Environment + Startup
- [ ] `cp .env.example .env` succeeds
- [ ] `docker compose up -d db` starts Postgres cleanly
- [ ] `npm install` completes without errors
- [ ] `npx prisma migrate dev --name init` runs successfully
- [ ] `npm run dev` serves app at `http://localhost:3000`

## 2) Core Lead Workflow
- [ ] Create a lead with required fields
- [ ] Edit lead details and save
- [ ] Move lead across status pipeline (`new` → `contacted` → `replied`)
- [ ] Mark a lead as `hot` and verify visual/state update
- [ ] Add notes and confirm timeline/event visibility

## 3) AI Draft Safety Flow
- [ ] Generate first follow-up draft in `SEND_MODE=manual`
- [ ] Edit generated draft content
- [ ] Approve draft and verify state transition
- [ ] Reject another draft and verify reason/audit entry
- [ ] Confirm no live outbound send is attempted in manual mode

## 4) Queue + Prioritization
- [ ] Queue page loads without errors
- [ ] Stale leads are surfaced ahead of normal leads
- [ ] Hot leads appear with priority treatment
- [ ] Completing an action updates next-best-action ordering

## 5) CSV Import
- [ ] Import valid sample CSV and verify all rows added
- [ ] Import file with one invalid row; verify safe partial handling
- [ ] Duplicate lead handling matches expected behavior (no silent corruption)

## 6) Auditability + Security
- [ ] Audit entries exist for generate/approve/reject actions
- [ ] No secrets are visible in UI/logs/repo files
- [ ] `.env` is untracked (`git status` clean of secrets)

## 7) Regression Smoke
- [ ] `npm test` passes
- [ ] `npm run lint` passes (if configured)
- [ ] `npm run build` passes

## 8) Browser/Device Spot Check
- [ ] Desktop Chrome latest: critical paths pass
- [ ] Mobile viewport (responsive): lead list/detail remains usable
- [ ] No blocking console errors during core workflow

## Sign-off
- Tester:
- Date:
- Branch/PR:
- Notes/bugs found:

### Bug Log (if any)
- Severity:
- Repro steps:
- Expected:
- Actual:
- Screenshot/video link:
