# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## Stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create local environment file**
   ```bash
   cp .env.example .env
   ```
3. **Start local database**
   ```bash
   docker compose up -d db
   ```
4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Start development server**
   ```bash
   npm run dev
   ```

App runs at `http://localhost:3000` by default.

## Test
```bash
npm test -- --run
```

## Useful commands
- Stop database: `docker compose down`
- Recreate clean database volume: `docker compose down -v && docker compose up -d db`
- Generate Prisma client: `npx prisma generate`

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions

## Deployment
- See `docs/deployment.md` for production-safe deployment steps and post-deploy checks.
