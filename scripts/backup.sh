#!/bin/sh
set -eu
umask 077
if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then
  command -v age >/dev/null 2>&1 || { echo 'Install age to encrypt this backup.' >&2; exit 1; }
fi
mkdir -p backups
backup_path="backups/follow-through-$(date -u +%Y%m%dT%H%M%SZ).dump"
partial_path="$backup_path.partial"
trap 'rm -f "$partial_path"' EXIT HUP INT TERM
docker compose -f compose.selfhost.yml exec -T db pg_dump -U followthrough -d followthrough -Fc > "$partial_path"
if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then
  age -r "$BACKUP_AGE_RECIPIENT" -o "$backup_path.age" "$partial_path"
  backup_path="$backup_path.age"
else
  mv "$partial_path" "$backup_path"
fi
printf 'Backup created: %s\n' "$backup_path"
