# Verification

The CI `verify` job is required before merging. It installs locked dependencies on Node 22, audits moderate-or-higher advisories, checks lint/types, applies migrations to PostgreSQL 16, seeds fictional data, runs unit/integration tests, verifies a legacy upgrade, builds the production app and runs Playwright against separate demo/authenticated servers.

Integration coverage includes workspace isolation, denied public signup, atomic contact logging, stale task revisions, duplicate review/merge, complete backup restore, durable notification deduplication/retries/uncertain delivery, selected writing context, encrypted Gmail OAuth state replay protection, idempotent message sync and queue/history pagination. Provider boundaries use explicit fixtures; no live email, Gmail or paid AI calls are made.

Browser coverage exercises saved CRUD, notes, draft decisions/revisions, opt-out, atomic imports, malformed/foreign-origin requests, schedule/snooze/completion, authenticated export/restore, invitations/handoffs/removal, writing profiles, persistent onboarding, feedback preview and mobile width. All fixtures use fictional accounts and data. Exact counts are visible in each CI run and may increase as coverage grows.

Use only a database whose name ends in `_test` for integration/browser checks. Set DATABASE_URL before migration/build, supply a random test BETTER_AUTH_SECRET, and run the README commands. The suite creates and deletes records and browser account sessions. The legacy upgrade script requires its own disposable `_test` database.

Release workflows additionally build production-only Docker images for two architectures and test a fresh Compose stack: migrations, hidden-CLI owner creation, authenticated API access, worker heartbeat and a database dump/restore into another database. Public release assets have SHA-256 checksums. This does not replace operator testing of an actual hosted domain, provider accounts or off-host backup recovery.
