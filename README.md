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

## Deployment

### 1) Prepare environment
Create production env vars in your host (or platform secret manager):
- `DATABASE_URL` (PostgreSQL connection string)
- `SEND_MODE=manual` (keep manual mode for beta)
- `OPENAI_API_KEY` (optional unless AI drafting is enabled)

Do not commit `.env` files. Use platform-managed secrets only.

### 2) Database migration
Run migrations against the production database:
```bash
npx prisma migrate deploy
```

### 3) Build + start
```bash
npm ci
npm run build
npm run start
```

### 4) Post-deploy checks
- Home page loads without server errors
- App can connect to PostgreSQL
- `SEND_MODE` is still `manual`
- Logs show no missing-secret errors

### Optional: Docker-based deployment
Build and run with your own process manager/reverse proxy:
```bash
docker compose up -d db
npm ci && npm run build && npm run start
```
