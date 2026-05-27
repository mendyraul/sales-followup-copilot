# AI Sales Follow-Up Copilot — Launch README

Manual-safe MVP for SMB sales follow-up workflows. This repo is optimized for local development first, with explicit guardrails to prevent accidental live outreach.

## Launch Scope (MVP)
- Lead + follow-up workflow foundation
- Local dev stack wired (Next.js + Prisma + Postgres)
- Mock/default AI mode for safe testing
- Manual send mode as default safety posture

## Current Status
- **Stage:** MVP scaffold + core docs
- **Default mode:** `SEND_MODE=manual`
- **Outbound safety:** live messaging disabled by default

## Tech Stack
- Next.js + TypeScript
- Prisma ORM
- PostgreSQL
- Vitest
- Docker Compose

## 3-Minute Local Launch
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Start local database:
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

App should be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Prisma/PostgreSQL connection string for local development. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | Display name shown in the app UI. |
| `SEND_MODE` | Yes | `manual` | Outbound behavior safety switch. Keep `manual` for local/testing workflows. |
| `AI_PROVIDER` | Yes | `mock` | AI backend selector. Keep `mock` to avoid external provider calls. |
| `AI_API_KEY` | Conditionally | empty | API key for non-mock AI providers. Leave empty when `AI_PROVIDER=mock`. |

## Safety Guardrails
- Keep `SEND_MODE=manual` unless explicitly approved for live sends.
- Keep `AI_PROVIDER=mock` during local testing.
- Never commit real API keys or production database URLs.
- Preserve auditable actions for generated and reviewed drafts.

## Manual QA Checklist (Launch)
- [ ] App boots locally with `npm run dev`
- [ ] DB migrations apply cleanly
- [ ] No secrets stored in tracked files
- [ ] Default mode remains manual-safe
- [ ] README setup steps validated end-to-end

## Contributing Workflow
- Use `feature/*` branches for all implementation work.
- Open PRs into `dev` for review.
- Do **not** push directly to `main`/`master`.

## Planned Next Steps
- Deployment runbook
- Test coverage expansion
- Lead workflow UX improvements
- AI provider abstraction hardening
