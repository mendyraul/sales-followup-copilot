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

## Setup Instructions

### 1) Clone and install dependencies
```bash
git clone https://github.com/mendyraul/sales-followup-copilot.git
cd sales-followup-copilot
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
```

Required variables in `.env`:
- `DATABASE_URL` (PostgreSQL connection string)
- `SEND_MODE` (defaults to `manual` for safe testing)

### 3) Start the database
```bash
docker compose up -d db
```

### 4) Initialize Prisma
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5) Run the app
```bash
npm run dev
```

Open `http://localhost:3000`.

## Helpful Scripts
- `npm run dev` — start local dev server
- `npm run test` — run test suite
- `npm run lint` — run lint checks
- `npx prisma studio` — inspect/edit DB data

## Troubleshooting
- **Port 5432 already in use:** stop local Postgres or map a different host port in `docker-compose.yml`.
- **Prisma connection errors:** verify `DATABASE_URL` and ensure `docker compose ps` shows `db` as healthy.
- **Missing generated Prisma client:** run `npx prisma generate`.

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
