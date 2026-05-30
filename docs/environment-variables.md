# Environment Variables

Manual-safe by default. Keep outbound messaging disabled in dev/demo unless explicitly approved.

## Required

- `DATABASE_URL`: Prisma Postgres connection string
- `SEND_MODE`: set to `manual` for MVP/dev

## Optional

- `PORT`: app port override (default `3000`)
- `NODE_ENV`: runtime mode (`development`/`production`)

## Safe Defaults

- `SEND_MODE=manual`
- Never commit real credentials
- Use local `.env` overrides per machine
