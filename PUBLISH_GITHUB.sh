#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
exec bash scripts/publish-github-pages.sh
