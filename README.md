# Sales Follow-Up Copilot

MVP scaffold for SMB lead follow-up workflow.

## Stack
- Next.js + TypeScript
- Prisma + PostgreSQL
- Vitest
- Docker Compose

## Setup instructions

### Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose plugin

### 1) Configure environment
```bash
cp .env.example .env
```
Fill in `.env` values before first run (database URL, app URL, and any provider keys).

### 2) Start local database
```bash
docker compose up -d db
```

### 3) Install dependencies
```bash
npm install
```

### 4) Initialize database schema
```bash
npx prisma migrate dev --name init
```

### 5) Run the app
```bash
npm run dev
```
Open `http://localhost:3000`.

### 6) Run tests
```bash
npm test
```

### Common scripts
- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run lint` — lint checks
- `npm test` — run test suite

## Safety defaults
- Test/manual mode only by default (`SEND_MODE=manual`)
- No live email/SMS sending enabled
- No secrets in source control
- Audit logs required for generated/sent actions
