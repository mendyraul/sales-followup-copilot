# Launch README — Sales Follow-Up Copilot (MVP)

This guide covers the minimum production launch steps for the Sales Follow-Up Copilot MVP.

## 1) Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose
- PostgreSQL 15+ (or Dockerized `db` service)

## 2) Environment setup
1. Copy env template:
   - `cp .env.example .env`
2. Set required variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY` (or provider key used by the app)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `SEND_MODE=manual` (default for safe launch)

## 3) Install and prepare database
1. Install dependencies: `npm install`
2. Start database (if local): `docker compose up -d db`
3. Run migrations: `npx prisma migrate deploy`
4. (Optional) Seed demo data: `npm run db:seed`

## 4) Build + smoke test
1. Build: `npm run build`
2. Start app: `npm start`
3. Validate:
   - App loads at `/`
   - Lead create/edit works
   - Draft generation path works in manual mode
   - Audit log captures draft actions

## 5) Launch safety checklist
- [ ] `SEND_MODE=manual` is set in production
- [ ] No plaintext secrets committed to git
- [ ] Health check endpoint responds 200
- [ ] Error logging is enabled
- [ ] Rollback plan documented

## 6) Rollback plan
If launch fails:
1. Revert to previous deployment artifact.
2. Re-run prior stable database migration state if needed.
3. Keep send mode in manual until verification passes.

## 7) Post-launch day-1 checks
- Verify error rates and response times hourly for first 24h.
- Confirm lead workflow can complete end-to-end.
- Review audit logs for unexpected actions.
