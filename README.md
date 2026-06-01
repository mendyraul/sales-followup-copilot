# Sales Follow-Up Copilot

Sales Follow-Up Copilot helps small teams keep warm leads moving with structured follow-up workflows, safe manual-send defaults, and clear pipeline visibility.

## MVP scope
- Lead capture and lifecycle tracking
- Follow-up draft generation workflow
- Review/edit gate before any outbound action
- Timeline/audit visibility

## Tech stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Local setup
1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres:
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Environment variables
| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string for Prisma |
| `PORT` | No | `3000` | App port |
| `SEND_MODE` | No | `manual` | Delivery mode. Keep `manual` for safe testing |
| `NODE_ENV` | No | `development` | Runtime mode |

## Safety and launch guardrails
- Default send behavior is **manual approval only**.
- Never commit secrets to source control.
- Generated follow-up content should be human-reviewed before send.
- Keep audit logging enabled for create/edit/send actions.

## Current status
This repository is in active MVP build-out. See GitHub issues for tracked slices and implementation order.
