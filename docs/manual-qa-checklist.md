# Manual QA Checklist

Use this checklist before opening or merging a PR.

## Setup
- [ ] `.env` exists and is based on `.env.example`
- [ ] PostgreSQL is running (`docker compose up -d db`)
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma migrations applied (`npx prisma migrate dev`)

## Core smoke checks
- [ ] App boots locally (`npm run dev`) without runtime errors
- [ ] Home/dashboard page renders
- [ ] Lead list page renders (if implemented)
- [ ] Any create/update actions complete without server errors

## Safety and guardrails
- [ ] `SEND_MODE` remains `manual` in local/dev testing
- [ ] No live outbound messaging is triggered
- [ ] No secrets were added to tracked files

## Quality checks
- [ ] Unit tests pass (`npm test`)
- [ ] Lint/type checks pass (if configured)
- [ ] New or changed behavior is documented in README or related docs

## Release readiness
- [ ] Branch is pushed
- [ ] PR references the issue and summarizes manual QA results
