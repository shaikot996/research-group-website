#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v node >/dev/null || { echo "Install Node.js 22+ and npm first."; exit 1; }
npm ci --no-audit --no-fund
npm run setup
npm run build
export PORT="${1:-${PORT:-3000}}"
export BIND_HOST="${HOSTNAME_BIND:-127.0.0.1}"
exec npm start
