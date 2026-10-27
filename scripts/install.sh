#!/bin/sh
set -eu
command -v docker >/dev/null 2>&1 || { echo 'Install Docker with Compose first.' >&2; exit 1; }
if [ ! -f .env ]; then
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/work" -w /work node:22-bookworm-slim node scripts/setup.mjs
fi
if [ "${FOLLOW_THROUGH_PREBUILT:-0}" = '1' ]; then
  docker compose -f compose.selfhost.yml up --no-build -d
else
  docker compose -f compose.selfhost.yml up --build -d
fi
printf '\nCreate your owner account:\n  docker compose -f compose.selfhost.yml exec app npm run account:owner -- --email=you@example.com\n\nOpen the APP_URL configured in .env (default http://127.0.0.1:3116).\n'
