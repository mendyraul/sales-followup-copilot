# Launch Runbook (Beta)

This runbook is the operator guide for launching **Sales Follow-Up Copilot** in safe manual mode.

## Launch Goal
Ship a usable beta where a real user can capture leads, generate follow-up drafts, approve/edit manually, and work a prioritized queue without sending live outbound messages automatically.

## Required Preconditions
- `SEND_MODE=manual`
- `AI_PROVIDER=mock` (or approved provider with key configured)
- Postgres running and migrations applied
- No production credentials committed

## Pre-Launch Checks
1. **Environment**
   - `.env` created from `.env.example`
   - `DATABASE_URL` points to local/test database
2. **Dependencies & DB**
   - `npm install`
   - `npx prisma migrate dev`
3. **Quality Gate**
   - `npm test` passes
   - No critical lint/build failures
4. **Safety Gate**
   - Manual approval flow required before send
   - Audit logging active for generation + approval/rejection events

## Smoke Test Flow (Operator)
1. Create one lead manually from UI
2. Import a small CSV (2–5 rows)
3. Open a lead and generate follow-up draft
4. Edit draft and approve in manual mode
5. Confirm timeline/audit entries appear
6. Verify queue ordering reflects stale/hot logic

## Known Beta Constraints
- Manual/test mode only (no default live outbound)
- Single-user oriented workflow
- Basic analytics only

## Rollback Plan
If beta quality degrades or blocking bugs appear:
1. Stop demo traffic
2. Revert to last known good commit/tag
3. Re-run migrations only if backward-compatible
4. Re-execute smoke test flow before relaunch

## Demo Script (10 minutes)
1. Show lead intake (manual + CSV)
2. Show stage progression (`new` → `contacted`)
3. Generate, edit, approve one follow-up draft
4. Show audit log/timeline for that decision
5. Show queue prioritization changes

## Exit Criteria
- New user can setup from clone in <15 minutes
- One lead goes end-to-end through manual-safe follow-up
- No blocker in CRUD, queue, draft, import, or audit surfaces
