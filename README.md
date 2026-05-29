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

### 1) Clone and enter project
```bash
git clone https://github.com/mendyraul/sales-followup-copilot.git
cd sales-followup-copilot
```

### 2) Install dependencies
```bash
npm install
```

### 3) Configure environment
```bash
cp .env.example .env
```
Minimum local settings:
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_copilot?schema=public"`
- `SEND_MODE="manual"`

### 4) Start local database
```bash
docker compose up -d db
```

### 5) Run migrations
```bash
npx prisma migrate dev --name init
```

### 6) Start app
```bash
npm run dev
```
Open http://localhost:3000

## Verification checklist
- `docker compose ps` shows `db` as healthy/running
- `npx prisma migrate status` shows migration applied
- `npm run test` exits successfully
- App loads at `http://localhost:3000`

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
