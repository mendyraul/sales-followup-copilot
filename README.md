# Sales Follow-Up Copilot

Sales Follow-Up Copilot helps SMB teams generate consistent, high-quality follow-up messages from lightweight lead context.

## Launch Scope

- Guided draft generation for follow-up outreach
- Channel-ready outputs (email/SMS style variants)
- Safety-first default mode (`SEND_MODE=manual`)
- Auditability for generated and sent actions

## Tech Stack

- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Quick Start

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the local database:
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run initial Prisma migration:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the app:
   ```bash
   npm run dev
   ```

## Quality Checks

```bash
npm run lint
npm test
```

## Safety Defaults

- Manual/test mode enabled by default (`SEND_MODE=manual`)
- No live outbound email/SMS enabled by default
- Secrets must not be committed to source control
- Audit trail required for message generation and send actions

## Repo Layout

- `src/` — application source code
- `prisma/` — schema and migrations
- `docs/` — supporting documentation

## Status

This README is launch-oriented and will expand with deployment and operations guidance as the product moves beyond MVP.
