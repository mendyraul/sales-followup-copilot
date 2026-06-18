# Deployment Guide

This project is designed for **safe/manual operation by default**. Use this guide to deploy without enabling live outbound messaging.

## 1) Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 10+

## 2) Environment variables
Create a production `.env` from `.env.example` and set at minimum:
- `DATABASE_URL`
- `OPENAI_API_KEY` (or provider key used by your AI adapter)
- `SEND_MODE=manual` (recommended default)

> Never commit real `.env` files or credentials.

## 3) Database setup
Run migrations before first deploy:

```bash
npx prisma migrate deploy
```

(Optional) verify Prisma client is generated:

```bash
npx prisma generate
```

## 4) Build and start

```bash
npm ci
npm run build
npm run start
```

Default app port is typically `3000`.

## 5) Docker Compose (local/prod-like)
For local validation:

```bash
docker compose up -d db
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

## 6) Platform notes (Vercel/Render/Fly/etc.)
- Add all required env vars in platform settings
- Run `prisma migrate deploy` as part of release command
- Keep `SEND_MODE=manual` until explicit human approval to go live
- Ensure logs are retained for auditability

## 7) Post-deploy checklist
- App health check passes
- DB connectivity works
- Lead CRUD works
- Follow-up generation works in manual mode
- No secrets exposed in logs/UI
