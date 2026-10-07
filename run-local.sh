#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

command -v node >/dev/null || { echo "ERROR: Install Node.js 22+ and npm first." >&2; exit 1; }
command -v npm >/dev/null || { echo "ERROR: npm is required." >&2; exit 1; }

PORT_VALUE="${1:-${PORT:-3000}}"
SYNC_INTERVAL="${LOCAL_DRIVE_SYNC_SECONDS:-600}"
if ! [[ "$SYNC_INTERVAL" =~ ^[0-9]+$ ]]; then
  echo "ERROR: LOCAL_DRIVE_SYNC_SECONDS must be a non-negative integer." >&2
  exit 1
fi

echo "==> [1/5] Installing exact dependencies"
npm ci --no-audit --no-fund

echo "==> [2/5] Preparing database/content"
npm run setup

echo "==> [3/5] Syncing Google Drive Research Assistants NOW"
if npm run sync:drive; then
  echo "==> Google Drive startup sync completed"
else
  echo "WARNING: Google Drive startup sync failed. The local site will still start using the last/bootstrap data." >&2
  echo "         Run 'npm run sync:drive' directly to see the full error and fix Drive access." >&2
fi

echo "==> [4/5] Building production Next.js app"
npm run build

export PORT="$PORT_VALUE"
export BIND_HOST="${HOSTNAME_BIND:-127.0.0.1}"

echo "==> [5/5] Starting local site at http://${BIND_HOST}:${PORT}"
if (( SYNC_INTERVAL > 0 )); then
  echo "==> Google Drive auto-sync is ON: every ${SYNC_INTERVAL}s"
  (
    while sleep "$SYNC_INTERVAL"; do
      echo
      echo "==> [Drive watch] $(date '+%Y-%m-%d %H:%M:%S') syncing Research Assistants"
      npm run sync:drive:optional || true
    done
  ) &
  SYNC_PID=$!
  cleanup() { kill "$SYNC_PID" >/dev/null 2>&1 || true; }
  trap cleanup EXIT INT TERM
else
  echo "==> Google Drive auto-sync is OFF (LOCAL_DRIVE_SYNC_SECONDS=0)"
fi

npm start
