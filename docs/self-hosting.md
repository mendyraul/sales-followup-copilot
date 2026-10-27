# Self-hosting

## Fresh install

Clone the repository, enter its directory and run `sh scripts/install.sh`. Docker and Compose are the only runtime prerequisites; the installer uses a temporary Node container to create `.env` with unique secrets and mode 0600, builds the image and starts the services. It never overwrites an existing `.env`. The app binds to loopback port 3116; PostgreSQL has no host port.

Create an owner:

```sh
docker compose -f compose.selfhost.yml exec app npm run account:owner -- --email=you@example.com
```

Enter a password at the hidden prompt, then sign in at the configured APP_URL. Name the workspace, choose its timezone in Settings, and invite members using private invitation links. SMTP is optional. No public signup endpoint can create an uninvited account. The first owner claims the legacy workspace if it is unowned; additional owners receive separate workspaces. Repeating the command for an existing email changes its password and revokes its sessions.

Do not run the fictional seed command on a real instance. App, worker and migrations use the same image and database. The app waits for successful migrations; worker health reflects successful reconciliation, not just a running process:

```sh
docker compose -f compose.selfhost.yml ps
docker compose -f compose.selfhost.yml logs --tail=60 app worker migrate
```

## Prebuilt release images

Tagged releases build separate `linux-amd64` and `linux-arm64` image archives. Download the matching archive and its checksum from the release assets; use source installation if assets are not yet available. For example, on Apple Silicon or ARM Linux:

```sh
shasum -a 256 -c follow-through-v0.2.0-linux-arm64.tar.gz.sha256
docker load -i follow-through-v0.2.0-linux-arm64.tar.gz
FOLLOW_THROUGH_PREBUILT=1 sh scripts/install.sh
```

On x86-64 choose `linux-amd64`. The archive loads `follow-through:0.2.0`, matching Compose. Review checksums and source before running downloaded software. Installation still needs the repository's Compose/setup scripts. Override `FOLLOW_THROUGH_IMAGE` in `.env` for another tested version.

## Remote hosting or a small pilot

Use authenticated self-host mode. Set APP_URL to your exact HTTPS origin before starting; cookies and origin checks use it. Place a TLS reverse proxy on the same host in front of `127.0.0.1:3116`, keep PostgreSQL private, retain the worker, and create only invited accounts. If the proxy runs in Docker, connect it on the Compose network and forward to `app:3000`; do not expose the database. Document your hostname, TLS renewal, backup location, administrator and recovery process.

Before inviting users: verify a second member cannot read another workspace, accept an invitation, assign a contact, see an in-app due reminder, export/restore a fictional workspace and restart the stack without losing it. Test SMTP/Gmail separately if enabled. Keep the app reachable only by invited testers until these checks pass. An actual server and domain must be selected by the operator; the repository does not provision hosting automatically.

## Backups and recovery

For an administrator backup containing the entire instance, including account data and encrypted connector credentials:

```sh
sh scripts/backup.sh
```

The private file lands in ignored `backups/`. Move it off the host. Optionally set `BACKUP_AGE_RECIPIENT` to encrypt using an installed `age` command. Preserve `.env` separately in an encrypted secret store: OAuth tokens cannot be decrypted without TOKEN_ENCRYPTION_KEY and changing BETTER_AUTH_SECRET invalidates sessions. Backups are sensitive even when connector tokens are encrypted.

Rehearse a database restore into an empty, isolated PostgreSQL 16 database, never over a live workspace:

```sh
pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" backups/your-backup.dump
```

Use a separately configured instance for the restored database, with outbound services disabled. Confirm record counts, sign-in and workspace history before treating it as recoverable. Restore encrypted files with `age --decrypt` first. The workspace JSON UI is a different, credential-free portability mechanism: preview it, then restore a NEW workspace. Assignments are cleared and the importing owner owns it; accounts/invitations/integrations are not restored.

## Upgrade

Back up first and keep the current `.env` and volume. Check out a tested release tag, then run `docker compose -f compose.selfhost.yml up --build -d` (or load its matching prebuilt image and use `--no-build`). Compose applies the versioned additive migrations before starting the app. Check service health and an authenticated workflow after the upgrade. Never use `down -v`, `db push`, `migrate reset` or an automatic downgrade against important data. Rollback after a schema change may require restoring the pre-upgrade backup into a separate instance.
