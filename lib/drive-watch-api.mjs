/**
 * Minimal dependency-free Google Drive readonly API for the GitHub watcher.
 * Standard Node ESM intentionally avoids tsx/CJS interop in long-lived jobs.
 */
import { createSign } from "node:crypto";

function base64url(value) {
  return Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function readWatchServiceAccount() {
  const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  let value;
  try { value = JSON.parse(raw); }
  catch { throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON."); }
  if (typeof value.client_email !== "string" || typeof value.private_key !== "string") {
    throw new Error("Google service account requires client_email and private_key.");
  }
  return value;
}

export async function getWatchDriveAccessToken(account) {
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: tokenUri,
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + "." + claims;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + "." + base64url(signer.sign(account.private_key));
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("Google service account OAuth failed (HTTP " + response.status + ").");
  const json = await response.json();
  if (!json.access_token) throw new Error("Google OAuth token missing from response.");
  return json.access_token;
}

export async function listWatchDriveChildren(bearerToken, folderId) {
  const rows = [];
  let pageToken = "";
  let pages = 0;
  do {
    const params = new URLSearchParams({
      q: "'" + folderId.replaceAll("'", "\\'") + "' in parents and trashed = false",
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)",
      pageSize:"1000",
      orderBy:"name",
      supportsAllDrives:"true",
      includeItemsFromAllDrives:"true"
    });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch("https://www.googleapis.com/drive/v3/files?" + params, {
      headers: { Authorization: "Bearer " + bearerToken },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error("Google Drive listing failed (HTTP " + response.status + ").");
    const json = await response.json();
    rows.push(...(json.files || []));
    pageToken = json.nextPageToken || "";
    pages += 1;
    if (pages > 100) throw new Error("Google Drive watcher pagination safety limit.");
  } while (pageToken);
  return rows;
}
