#!/usr/bin/env sh
set -eu
cd /app
mkdir -p /app/data/uploads
if [ ! -f /app/data/site.db ]; then
  umask 077
  : > /app/data/site.db
fi
npm run db:push -- --skip-generate
npm run db:seed
exec "$@"
