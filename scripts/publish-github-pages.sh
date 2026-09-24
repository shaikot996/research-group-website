#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/shaikot996/research-group-website.git}"
REPO_SLUG="${REPO_SLUG:-shaikot996/research-group-website}"
BASE_PATH="${GITHUB_PAGES_BASE_PATH:-/research-group-website}"
PORT="${EXPORT_PORT:-4173}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for cmd in git node npm curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: $cmd is required." >&2; exit 1; }
done

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 22 )); then
  echo "ERROR: Node.js 22+ is required. Current: $(node -v)" >&2
  exit 1
fi

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  [[ -n "${PAGES_TMP:-}" && -d "${PAGES_TMP:-}" ]] && rm -rf "$PAGES_TMP" || true
}
trap cleanup EXIT INT TERM

echo "==> [1/8] Installing exact dependencies"
npm ci

echo "==> [2/8] Preparing database/content"
npm run setup

echo "==> [3/8] Building production Next.js app"
npm run build

echo "==> [4/8] Starting temporary production server"
PORT="$PORT" BIND_HOST="127.0.0.1" npm start > /tmp/fpcg-github-pages-server.log 2>&1 &
SERVER_PID=$!
READY=0
for _ in $(seq 1 120); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then READY=1; break; fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "ERROR: production server exited unexpectedly:" >&2
    cat /tmp/fpcg-github-pages-server.log >&2
    exit 1
  fi
  sleep 1
done
if [[ "$READY" != "1" ]]; then
  echo "ERROR: site did not start within 120 seconds." >&2
  cat /tmp/fpcg-github-pages-server.log >&2
  exit 1
fi

echo "==> [5/8] Creating + validating static GitHub Pages build"
EXPORT_ORIGIN="http://127.0.0.1:${PORT}" \
GITHUB_PAGES_BASE_PATH="$BASE_PATH" \
EXPORT_OUT_DIR="_site" \
node scripts/export-github-pages.mjs

kill "$SERVER_PID" >/dev/null 2>&1 || true
wait "$SERVER_PID" >/dev/null 2>&1 || true
SERVER_PID=""

echo "==> [6/8] Connecting this folder to the GitHub repository"
if [[ ! -d .git ]]; then
  git init
  git remote add origin "$REPO_URL"
else
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
  else
    git remote add origin "$REPO_URL"
  fi
fi

# Attach the current files to the latest remote main WITHOUT overwriting the
# fixed working tree from this package. Any obsolete remote-only deployment
# files therefore show up as deletions and are removed by the next commit.
git fetch origin main
git symbolic-ref HEAD refs/heads/main
git reset --mixed origin/main

git config user.name >/dev/null 2>&1 || git config user.name "Shaikot Jahan Shuvo"
git config user.email >/dev/null 2>&1 || git config user.email "shaikot996@users.noreply.github.com"

echo "==> [7/8] Pushing fixed source to main"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "Fix GitHub Pages deployment and navigation"
fi
git push origin main

echo "==> [8/8] Publishing validated static site to gh-pages"
PAGES_TMP="$(mktemp -d)"
cp -a _site/. "$PAGES_TMP/"
cd "$PAGES_TMP"
git init -q
git checkout -q -b gh-pages
git config user.name "Shaikot Jahan Shuvo"
git config user.email "shaikot996@users.noreply.github.com"
git add -A
git commit -q -m "Publish GitHub Pages demo"
git remote add origin "$REPO_URL"
git push --force origin gh-pages

configure_pages_source() {
  local configured=1

  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo "==> Configuring GitHub Pages to gh-pages/root with GitHub CLI"
    if gh api "repos/${REPO_SLUG}/pages" >/dev/null 2>&1; then
      gh api --method PUT "repos/${REPO_SLUG}/pages" \
        -f build_type=legacy \
        -f 'source[branch]=gh-pages' \
        -f 'source[path]=/' >/dev/null && configured=0 || true
    else
      gh api --method POST "repos/${REPO_SLUG}/pages" \
        -f 'source[branch]=gh-pages' \
        -f 'source[path]=/' >/dev/null && configured=0 || true
    fi
  fi

  if [[ "$configured" != "0" ]]; then
    local token="${GITHUB_TOKEN:-}"
    if [[ -z "$token" ]]; then
      local cred
      cred="$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null || true)"
      token="$(printf '%s\n' "$cred" | sed -n 's/^password=//p' | head -n1)"
    fi

    if [[ -n "$token" ]]; then
      echo "==> Configuring GitHub Pages to gh-pages/root with GitHub API"
      local api="https://api.github.com/repos/${REPO_SLUG}/pages"
      local code
      code="$(curl -sS -o /tmp/fpcg-pages-api.json -w '%{http_code}' \
        -H "Authorization: Bearer ${token}" \
        -H 'Accept: application/vnd.github+json' \
        -H 'X-GitHub-Api-Version: 2022-11-28' \
        "$api" || true)"
      if [[ "$code" == "200" ]]; then
        code="$(curl -sS -o /tmp/fpcg-pages-api-update.json -w '%{http_code}' -X PUT \
          -H "Authorization: Bearer ${token}" \
          -H 'Accept: application/vnd.github+json' \
          -H 'X-GitHub-Api-Version: 2022-11-28' \
          -H 'Content-Type: application/json' \
          --data '{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}' \
          "$api" || true)"
        [[ "$code" == "204" || "$code" == "200" ]] && configured=0 || true
      elif [[ "$code" == "404" ]]; then
        code="$(curl -sS -o /tmp/fpcg-pages-api-create.json -w '%{http_code}' -X POST \
          -H "Authorization: Bearer ${token}" \
          -H 'Accept: application/vnd.github+json' \
          -H 'X-GitHub-Api-Version: 2022-11-28' \
          -H 'Content-Type: application/json' \
          --data '{"source":{"branch":"gh-pages","path":"/"}}' \
          "$api" || true)"
        [[ "$code" == "201" || "$code" == "200" ]] && configured=0 || true
      fi
    fi
  fi

  return "$configured"
}

PAGES_CONFIGURED=0
if configure_pages_source; then
  PAGES_CONFIGURED=1
else
  echo "NOTE: could not change Pages settings automatically; branch was still pushed correctly."
fi

cd "$ROOT"

echo "==> Waiting for the new GitHub Pages deployment and verifying live routes"
LIVE_BASE="https://shaikot996.github.io/research-group-website"
DEPLOY_OK=0
STAMP="$(date +%s)"
for _ in $(seq 1 80); do
  HOME_BODY="$(curl -fsSL "${LIVE_BASE}/?v=${STAMP}" 2>/dev/null || true)"
  PEOPLE_BODY="$(curl -fsSL "${LIVE_BASE}/people/?v=${STAMP}" 2>/dev/null || true)"
  RESEARCH_BODY="$(curl -fsSL "${LIVE_BASE}/research/?v=${STAMP}" 2>/dev/null || true)"
  if [[ "$HOME_BODY" == *"FPCG-GITHUB-PAGES-V4"*      && "$HOME_BODY" == *'href="/research-group-website/people/"'*      && "$PEOPLE_BODY" == *"FPCG-GITHUB-PAGES-V4"*      && "$RESEARCH_BODY" == *"FPCG-GITHUB-PAGES-V4"* ]]; then
    DEPLOY_OK=1
    break
  fi
  sleep 3
done

if [[ "$DEPLOY_OK" != "1" ]]; then
  echo
  echo "Static files were pushed, but the live GitHub Pages endpoint did not expose the V4 build yet."
  if [[ "$PAGES_CONFIGURED" != "1" ]]; then
    echo "Set exactly: Repo -> Settings -> Pages -> Deploy from a branch -> gh-pages -> /(root)"
  else
    echo "GitHub Pages may still be processing the deployment. Check the repo Pages status and rerun the script if needed."
  fi
  exit 2
fi

echo
echo "=============================================================="
echo "SUCCESS: V4 is live and route-checked"
echo "Website:      ${LIVE_BASE}/"
echo "People:       ${LIVE_BASE}/people/"
echo "Research:     ${LIVE_BASE}/research/"
echo "Publications: ${LIVE_BASE}/publications/"
echo "Projects:     ${LIVE_BASE}/projects/"
echo "=============================================================="
