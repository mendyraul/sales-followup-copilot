# Manual QA Checklist

Use this checklist before opening or updating a PR for the Sales Follow-Up Copilot.

## 1) Environment and setup
- [ ] `npm install` completes without errors.
- [ ] `.env` is configured from `.env.example` (if present).
- [ ] Database is running and reachable (`docker compose up -d` if needed).
- [ ] Prisma client can be generated (`npx prisma generate`).

## 2) Build and tests
- [ ] Unit tests pass (`npm test`).
- [ ] Lint passes (`npm run lint` if configured).
- [ ] Build succeeds (`npm run build` if configured).

## 3) Core user flows (manual-safe)
- [ ] App starts locally (`npm run dev`).
- [ ] Lead creation/edit/delete flow works.
- [ ] Follow-up draft generation works in test/manual mode.
- [ ] Approve/edit/reject draft flow works without sending live outbound messages.
- [ ] Audit trail captures key actions (draft generation, approvals, edits, rejections).

## 4) Data and guardrails
- [ ] No secrets committed (`git diff` review + `.env` ignored).
- [ ] Validation paths tested (empty/invalid inputs blocked cleanly).
- [ ] Test mode defaults remain enabled for safety.

## 5) PR readiness
- [ ] README/docs updated for new behavior.
- [ ] Screenshots or notes added for significant UI changes.
- [ ] PR description includes what changed, how tested, and any follow-up work.

## Suggested smoke-test commands
```bash
npm install
npm test
npm run dev
```
