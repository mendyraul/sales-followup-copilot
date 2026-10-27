# Deployment and migrations

See [self-hosting](self-hosting.md) for authenticated Docker installation, backups and optional remote hosting. The fictional demo has a separate Compose file and volume; do not point tests at real data.

Eight committed migrations cover the initial schema, draft revisions, accounts/workspaces, true contact timestamps/tasks, merges/portability, durable reminders/team assignments, Gmail/writing profiles and onboarding. Existing records stay in the `legacy` workspace; the first bootstrapped owner claims that workspace. Names are no longer unique. Never regenerate the initial migration to install an upgrade.

For a database originally created by `prisma db push`, back it up and confirm it exactly matches commit `68aad43`'s original schema before baselining:

```sh
npx prisma migrate resolve --applied 202610270001_initial
npm run db:migrate
```

Only mark a migration applied when its schema already exists. Drift or a different migration history requires reconciliation, not a reset. The legacy migration verification script tests preserving records through the committed migrations in a disposable `_test` database.

CI runs dependency audit, lint, types, real PostgreSQL integration tests, upgrade preservation, production build and browser workflows. Release archives build on native x86-64/ARM runners, start a fresh database, apply migrations, bootstrap a fictional account and verify authenticated access and worker health before upload. Images contain production dependencies including the owner CLI and worker, run as a non-root user, and exclude environment files and backups.

Keep the app and worker on the same version. Preserve `.env` secrets and volumes; stop a source server before writing its `.next` directory. No automatic process sends prospect email, including after approval. No external analytics are enabled. Configure provider services only after testing their actual accounts and permissions.
