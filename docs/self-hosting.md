# Self-hosting

The authenticated application and hosted pilot run the same code. No paid API is required for template drafts or in-app work. The local fictional demo remains available with `npm run demo`.

For a source installation, run `npm run setup` once to create unique secrets (never commit `.env`). Run `docker compose -f compose.selfhost.yml up --build -d`, then `docker compose -f compose.selfhost.yml exec app npm run account:owner -- --email=you@example.com`. The command prompts for a hidden password. Open the configured APP_URL and sign in. The owner command also recovers an existing account password and revokes its sessions.

The first owner claims the legacy workspace, preserving existing record IDs and history. Other owners created by the instance administrator receive separate workspaces. Public signup is disabled; workspace invitations allow additional members to register. Do not seed fictional data into a real workspace.

The default Docker port is bound to loopback. For public hosting, set APP_URL to the HTTPS origin and place a reverse proxy in front of the app. Keep database access private. Always back up the database before upgrades; the migration container applies versioned, additive migrations before the app starts. Keep the existing volume and secret keys on upgrades.

SMTP and Gmail settings are optional. The template provider remains available without an AI key. Never expose demo mode publicly.
