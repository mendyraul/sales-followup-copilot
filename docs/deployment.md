# Local deployment and migrations

This release targets a local, single-operator demonstration. The default development and production start commands bind to 127.0.0.1. There is no authentication. Add authentication, authorization, tenant isolation, and a deployment-specific security review before exposing it publicly.

## Fresh database

Run `npm ci`, `docker compose up -d --wait db`, `npm run db:migrate`, and optionally `npm run db:seed`. Migrations are committed; do not generate a new initial migration during setup. `npm run demo` runs this flow and starts a production build automatically.

## Existing database created with the original schema

Back up the database first. A database created by `prisma db push` or the old README has no migration history. Confirm it exactly matches `git show 68aad43:prisma/schema.prisma` before baselining. Do not mark a migration applied unless its tables and constraints already exist.

```bash
npx prisma migrate resolve --applied 202610270001_initial
npm run db:migrate
```

The second migration adds draft metadata and revision history without dropping leads, notes, feedback, drafts, or audit records. It backfills existing draft text as revision 1. Databases with another migration history or schema drift require a reviewed reconciliation; do not reset or drop them.

## Release checks

Run lint, typecheck, unit tests, dependency audit, production build, then browser tests against a separate test database. CI performs all of these. Browser tests save and reload actual records, check draft review conflicts, validate imports atomically, and check the mobile layout. See `docs/manual-qa.md` for the operator walkthrough.

Stop an existing server before building in the same checkout. Start with `npm run start -- --port 3115`. Confirm `/api/workspace` returns HTTP 200 and the dashboard shows saved contacts. Database failures return HTTP 503 with an actionable retry state rather than presenting fixture data as saved data.

## Persistence and backups

The Compose volume `sales-followup-demo_pgdata` retains records after app/container restarts. `docker compose stop db` keeps it. Do not use `docker compose down -v` unless you intend to erase all local demo data. Use standard `pg_dump`/`pg_restore` with the credentials in your local environment when preserving records.

Audit records survive lead deletion; related lead notes, timeline events and drafts are deleted, and feedback is retained with its lead relation cleared. No automatic sending exists in this release.
