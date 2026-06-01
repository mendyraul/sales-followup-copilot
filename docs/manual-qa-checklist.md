# Manual QA Checklist (MVP)

Use this checklist before opening or updating a release PR.

## Environment prep
- [ ] `cp .env.example .env`
- [ ] `docker compose up -d db`
- [ ] `npm ci`
- [ ] `npx prisma migrate dev`
- [ ] `npm run dev`

## Core workflow
- [ ] Create a lead with name, email, and status
- [ ] Edit lead status and verify status persists after refresh
- [ ] Open lead detail and add a timeline note
- [ ] Generate a follow-up draft for the lead
- [ ] Confirm generated draft requires manual approval (no auto-send)

## Queue & prioritization
- [ ] Verify stale lead detection marks old leads correctly
- [ ] Verify hot-lead flag is visible in lead list/queue
- [ ] Verify next-action is shown for at least one stale and one hot lead

## Data safety
- [ ] Confirm `SEND_MODE=manual` in active environment
- [ ] Confirm no real customer credentials are in local `.env`
- [ ] Confirm no production secrets are printed in logs

## Regression quick pass
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] App home/dashboard loads without console or server errors
