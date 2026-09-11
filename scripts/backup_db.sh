#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 2
fi

output_dir="${BACKUP_DIR:-backups}"
mkdir -p "$output_dir"
umask 077
file="$output_dir/fancy-$(date +%F-%H%M%S).dump"
pg_dump --format=custom --no-owner --file="$file" "$DATABASE_URL"
echo "Wrote $file"
