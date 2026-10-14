/**
 * Nearly continuous Drive polling directly on GitHub Actions.
 * Uses the EXISTING GOOGLE_SERVICE_ACCOUNT_JSON secret and the ephemeral
 * native GITHUB_TOKEN. No PAT, Google Apps Script, or external service.
 */
import { execFileSync } from "node:child_process";
import { driveFingerprint } from "../lib/drive-watch-state.mjs";
import {
  readGoogleServiceAccount,
  getGoogleDriveAccessToken,
  listGoogleDriveChildren,
} from "../lib/google-drive.ts";

const REPO = "shaikot996/research-group-website";
const ROOTS = [
  "10_rzMMevZi6_T-bajAnmaynab0UbDBtv",
  "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc",
  "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM",
];
const POLL_MS = 60000;
const DEBOUNCE_MS = 150000;
const RUNTIME_MS = 250 * 60000; // 4h 10m, below Actions' 6h job cap.
const account = readGoogleServiceAccount();

if (!account) throw new Error("A Google service account is required for the Drive watcher.");
if (!process.env.GH_TOKEN) throw new Error("Native GitHub Actions token is missing.");

let authToken = "";
let lastAuthMs = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listWithRefresh(id) {
  // Google OAuth access tokens expire within one hour.
  if (!authToken || Date.now() - lastAuthMs > 45 * 60000) {
    authToken = await getGoogleDriveAccessToken(account);
    lastAuthMs = Date.now();
  }
  return listGoogleDriveChildren({ type: "bearer", value: authToken }, id);
}

function dispatch(workflow, source) {
  execFileSync("gh", [
    "workflow", "run", workflow,
    "--repo", REPO,
    "--ref", "main",
    ...(source ? ["-f", "source=" + source] : []),
  ], { timeout: 45000, stdio: "pipe", env: process.env });
}

let baseline = null;
let lastDispatchMs = 0;
let successfulScans = 0;
let scanErrors = 0;
const startedAt = Date.now();

console.log("[watch] Starting authenticated Google Drive watcher (poll every 60s).");

while (Date.now() - startedAt < RUNTIME_MS) {
  try {
    const sample = await driveFingerprint(ROOTS, listWithRefresh);
    successfulScans += 1;

    if (baseline === null) {
      baseline = sample.digest;
      console.log("[watch] Initial baseline: " + sample.count + " items in " + sample.folders + " folders.");
      // The existing push-triggered website deploy handles the initial push.
      // Subsequent scheduled / self-chained watchers refresh the site on startup
      // to cover any changes in the brief handover interval.
      if (process.env.GITHUB_EVENT_NAME !== "push") {
        dispatch("sync-drive.yml", "watcher-handover");
        lastDispatchMs = Date.now();
        console.log("[watch] Handover deployment dispatched.");
      }
    } else if (sample.digest !== baseline) {
      if (Date.now() - lastDispatchMs >= DEBOUNCE_MS) {
        dispatch("sync-drive.yml", "drive-watcher");
        baseline = sample.digest; // Only advance state after successful dispatch.
        lastDispatchMs = Date.now();
        console.log("[watch] Drive change detected (" + sample.count + " items); deployment dispatched.");
      } else {
        console.log("[watch] Drive change detected; coalescing rapid edits.");
      }
    } else if (successfulScans % 20 === 0) {
      console.log("[watch] Healthy: " + successfulScans + " scans; no changes.");
    }
    scanErrors = 0;
  } catch (error) {
    scanErrors += 1;
    console.error("[watch] Scan or dispatch error (" + scanErrors + "): " + String(error));
    // Keep baseline unchanged and retry, instead of losing a Drive edit.
    if (scanErrors >= 10) {
      throw new Error("Drive watcher cannot read or dispatch after 10 attempts.");
    }
  }
  const remaining = RUNTIME_MS - (Date.now() - startedAt);
  if (remaining > 0) await sleep(Math.min(POLL_MS, remaining));
}
console.log("[watch] Rotation due after " + successfulScans + " scans. Exiting cleanly.");
