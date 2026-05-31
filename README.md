# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## Stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Quick start (under 3 minutes)
1. Copy env: `cp .env.example .env`
2. Start db: `docker compose up -d db`
3. Install deps: `npm install`
4. Prisma: `npx prisma migrate dev --name init`
5. Run app: `npm run dev`

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Deployment (safe MVP path)
### 1) Environment setup
- Set required variables from `.env.example` on the deployment target.
- Keep `SEND_MODE=manual` in production until outbound approval workflow is in place.
- Never commit `.env` or credential files.

### 2) Database
- Provision PostgreSQL 15+.
- Set `DATABASE_URL` to the production connection string.
- Run migrations during deploy: `npx prisma migrate deploy`.

### 3) Build and start
```bash
npm ci
npm run build
npm run start
```

### 4) Runtime checks
- Health check: app responds on configured `PORT`.
- Validate Prisma connectivity by exercising one read route.
- Confirm no outbound messaging providers are enabled unless explicitly approved.

### 5) CI/CD recommendation
- Run `npm test` and `npm run build` on every PR.
- Deploy from `main` only after review.
- Roll back by redeploying previous known-good artifact.

## Manual QA checklist
- Use docs/manual-qa-checklist.md before merge/deploy to validate safe manual-mode behavior.
