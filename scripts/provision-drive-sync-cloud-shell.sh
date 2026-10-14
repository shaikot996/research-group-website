#!/usr/bin/env bash
# Run in Google Cloud Shell for the selected SAM Research website project.
# Creates a read-only Google Drive identity and securely installs its JSON
# credential into GitHub Actions. No credential is written to the repository.
set -Eeuo pipefail

REPOSITORY="shaikot996/research-group-website"
SERVICE_ACCOUNT_NAME="sam-drive-sync"
SECRET_NAME="GOOGLE_SERVICE_ACCOUNT_JSON"
temporary_key=""

cleanup() {
  if [[ -n "$temporary_key" && -f "$temporary_key" ]]; then
    shred -u "$temporary_key" 2>/dev/null || rm -f "$temporary_key"
  fi
}
trap cleanup EXIT

for tool in gcloud mktemp; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: This script must run in Google Cloud Shell (missing $tool)." >&2
    exit 1
  fi
done

PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "ERROR: Select the SAM Research website Google Cloud project first." >&2
  exit 1
fi
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Google Cloud project: $PROJECT_ID"
echo "GitHub repository: $REPOSITORY"

echo "[1/4] Ensuring Google Drive API is enabled..."
gcloud services enable drive.googleapis.com --project="$PROJECT_ID" --quiet

echo "[2/4] Ensuring Service Account exists..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --project="$PROJECT_ID" \
    --display-name="SAM Research Group Drive Sync"
fi

echo "[3/4] Creating a temporary JSON credential..."
temporary_key="$(mktemp)"
chmod 600 "$temporary_key"
gcloud iam service-accounts keys create "$temporary_key" \
  --iam-account="$SERVICE_ACCOUNT_EMAIL" \
  --project="$PROJECT_ID" --quiet >/dev/null

echo "[4/4] Installing the GitHub Actions secret..."
if ! command -v gh >/dev/null 2>&1; then
  echo "Installing GitHub CLI in Google Cloud Shell..."
  sudo apt-get update -qq >/dev/null
  sudo apt-get install -y -qq gh >/dev/null
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub sign-in is needed once. Follow the browser/device prompt below."
  gh auth login --hostname github.com --git-protocol https --web
fi
if ! gh repo view "$REPOSITORY" >/dev/null 2>&1; then
  echo "ERROR: The authenticated GitHub user cannot access $REPOSITORY." >&2
  exit 1
fi
gh secret set "$SECRET_NAME" --repo "$REPOSITORY" --app actions < "$temporary_key"

echo
echo "SUCCESS: GitHub Actions now has a Service Account credential."
echo "Share the following email as VIEWER to the three Drive folders below:"
echo "  $SERVICE_ACCOUNT_EMAIL"
echo
echo "Research Assistants:"
echo "  https://drive.google.com/drive/folders/10_rzMMevZi6_T-bajAnmaynab0UbDBtv"
echo "Principal Investigators:"
echo "  https://drive.google.com/drive/folders/19uuYERTNBIaET6MlehwjF6kvS1L7sLlc"
echo "Co-Principal Investigators:"
echo "  https://drive.google.com/drive/folders/1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM"
echo
echo "Once these shares are added, run the Sync Drive profiles workflow."
echo "The private key is erased from Cloud Shell when this script exits."
