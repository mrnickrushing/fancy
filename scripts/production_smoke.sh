#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-https://ohyoufancyfocaccia.com}"
for path in /healthz /readyz /robots.txt /sitemap.xml / /order.html /breads.html /policies.html; do
  curl --fail --silent --show-error --location --output /dev/null "$base_url$path"
  printf 'ok %s\n' "$path"
done
