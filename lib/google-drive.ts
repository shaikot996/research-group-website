import { createSign } from "node:crypto";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

export type GoogleDriveAuth =
  | { type: "bearer"; value: string }
  | { type: "apiKey"; value: string };

export const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function readGoogleServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch (error) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ${String(error)}`);
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replaceAll("\\n", "\n").trim();
  return email && key ? { client_email: email, private_key: key } : null;
}

export async function getGoogleDriveAccessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.client_email, scope: DRIVE_SCOPE, aud: tokenUri, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(account.private_key))}`;
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google OAuth response did not contain an access token.");
  return payload.access_token;
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

export function parsePublicGoogleDriveFolderHtml(html: string) {
  const files: GoogleDriveFile[] = [];
  const seen = new Set<string>();
  const anchorRe = /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorRe)) {
    const href = decodeHtml(match[1] || match[2] || "");
    const name = stripHtml(match[3] || "");
    if (!href || !name) continue;

    const fileMatch = href.match(/https:\/\/drive\.google\.com\/file\/d\/([-\w]{20,})(?:[\/?#]|$)/i);
    if (fileMatch) {
      const id = fileMatch[1];
      if (!seen.has(id)) files.push({ id, name, mimeType: "application/octet-stream" });
      seen.add(id);
      continue;
    }

    const docsMatch = href.match(/https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([-\w]{20,})(?:[\/?#]|$)/i);
    if (docsMatch) {
      const [, kind, id] = docsMatch;
      const mimeType = kind === "document"
        ? GOOGLE_DOC_MIME
        : `application/vnd.google-apps.${kind === "spreadsheets" ? "spreadsheet" : "presentation"}`;
      if (!seen.has(id)) files.push({ id, name, mimeType });
      seen.add(id);
      continue;
    }

    const folderMatch = href.match(/https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([-\w]{20,})(?:[\/?#]|$)/i);
    if (folderMatch) {
      const id = folderMatch[1];
      if (!seen.has(id)) files.push({ id, name, mimeType: GOOGLE_DRIVE_FOLDER_MIME });
      seen.add(id);
    }
  }
  return files;
}

async function listPublicGoogleDriveChildren(folderId: string) {
  const url = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`;
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`Public Drive folder listing failed: ${response.status}`);
  const html = await response.text();
  const files = parsePublicGoogleDriveFolderHtml(html);
  if (!files.length && !/empty folder|folder is empty/i.test(html)) {
    throw new Error(`Public Drive folder ${folderId} returned no parseable child links.`);
  }
  return files;
}

async function driveFetch(auth: GoogleDriveAuth, url: string) {
  const target = new URL(url);
  const headers: Record<string, string> = {};
  if (auth.type === "bearer") headers.Authorization = `Bearer ${auth.value}`;
  else target.searchParams.set("key", auth.value);
  const response = await fetch(target, { headers });
  if (!response.ok) throw new Error(`Drive API ${response.status}: ${await response.text()}`);
  return response;
}

export async function listGoogleDriveChildren(auth: GoogleDriveAuth | null, folderId: string) {
  if (!auth) return listPublicGoogleDriveChildren(folderId);
  const files: GoogleDriveFile[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)",
      pageSize: "1000",
      orderBy: "name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const payload = await (await driveFetch(auth, `https://www.googleapis.com/drive/v3/files?${params}`)).json() as { files?: GoogleDriveFile[]; nextPageToken?: string };
    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return files;
}

export async function downloadGoogleDriveFile(auth: GoogleDriveAuth | null, file: GoogleDriveFile) {
  if (!auth) {
    const url = file.mimeType === GOOGLE_DOC_MIME
      ? `https://docs.google.com/document/d/${encodeURIComponent(file.id)}/export?format=txt`
      : `https://drive.usercontent.google.com/download?id=${encodeURIComponent(file.id)}&export=download&confirm=t`;
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36" },
    });
    if (!response.ok) throw new Error(`Public Drive file download failed for ${file.name}: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const url = file.mimeType === GOOGLE_DOC_MIME
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fplain`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`;
  const response = await driveFetch(auth, url);
  return Buffer.from(await response.arrayBuffer());
}
