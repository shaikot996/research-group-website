#!/usr/bin/env bash
# Local, read-only publication preview. GitHub Actions is the only deploy method.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export GITHUB_PAGES_BASE_PATH=""
export SITE_URL="https://sam.cse.bracu.ac.bd"
export EXPORT_OUT_DIR="_site"
export PORT="${EXPORT_PORT:-4173}"
export BIND_HOST="127.0.0.1"
export EXPORT_ORIGIN="http://127.0.0.1:${PORT}"

npm ci
npm run setup
npm run sync:drive:optional
npm run sync:inspire
npm run check:project
npm run typecheck
npm run build

server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM
npm start > /tmp/sam-github-pages-preview.log 2>&1 &
server_pid=$!
ready=0
for _ in {1..90}; do
  if curl -fsS "${EXPORT_ORIGIN}/" >/dev/null; then ready=1; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  cat /tmp/sam-github-pages-preview.log >&2
  echo "ERROR: local Next.js server did not start" >&2
  exit 1
fi
node scripts/export-github-pages.mjs
node scripts/verify-pages-export.mjs
printf '\nVerified local static snapshot: %s/_site\n' "$PWD"
echo "No Git branches were changed and nothing was pushed."
echo "Push source to main to deploy using the existing GitHub Actions workflow."
