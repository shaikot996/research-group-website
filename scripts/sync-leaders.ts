import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseDriveProfile } from "../lib/drive-profile";
import { imageExtensionFromBytes, validatePdf, portraitRank, cvRank } from "../lib/drive-leader-media";
import {
  downloadGoogleDriveFile, getGoogleDriveAccessToken, GOOGLE_DOC_MIME,
  listGoogleDriveChildren, readGoogleServiceAccount, type GoogleDriveAuth, type GoogleDriveFile,
} from "../lib/google-drive";

if (process.env.NODE_ENV !== "production") {
  try { process.loadEnvFile(".env"); } catch { /* GitHub Actions injects env */ }
}
const prisma = new PrismaClient();
const config = [
  { slug: "mahbubul-alam-majumdar", docId: "1EdG_uw-eW_lVNvcNMz__uWydIqPfywP6Q1GhM46veKo", folderId: "1cnZuSFd6ZVKe7T2AUqXNokDya7mkRMle" },
  { slug: "syed-hasibul-hassan-chowdhury", docId: "1lPvsr33Wv1RGvn_530ogjKqEJ8D_mjFn5S-nuP3iJDw", folderId: "1dWR5wvM9GuQyG_CPezk__8dkrhgB2BiW" },
  { slug: "ahmed-rakin-kamal", docId: "1J2pOnHjX7U3t_aiIpt3NznvyZ0jPZ63Yq_iNX4IMP8I", folderId: "1f8VaS6z-YIqkIrvtUxcn4uKEXVe6Pamp" },
  { slug: "mishaal-hai", docId: "1E1OcVzUsomwMsFjYzhqOZnBKPuodFthSm6Z5VvW-ESs", folderId: "1rJrAJmhUwMvjSQCELBJbK2jnVO_kOiKH" },
  { slug: "md-shaikot-jahan-shuvo", docId: "1JfqtGltntXeJpLebHI2MfV4X5OfKFBn5id0MnmWZlBs", folderId: "1U0JuxDwdIVyxDD_sgLa2qHoVQ-gGLEM1" },
] as const;
const imgRoot = path.resolve(process.env.DRIVE_PEOPLE_ASSET_DIR || "data/drive-people");
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "data/uploads");

async function retry<T>(label: string, fn: () => Promise<T>) {
  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fn(); }
    catch (error) {
      last = error;
      if (attempt < 3) {
        console.warn(`[leaders] Retrying ${label}: ${String(error)}`);
        await new Promise(resolve => setTimeout(resolve, 900 * attempt));
      }
    }
  }
  throw last;
}

async function syncOne(auth: GoogleDriveAuth | null, entry: typeof config[number]) {
  const existing = await prisma.person.findUnique({ where: { slug: entry.slug } });
  if (!existing || !["PRINCIPAL_INVESTIGATOR", "RESEARCHER"].includes(existing.role)) {
    throw new Error(`Expected established PI/Co-PI profile missing: ${entry.slug}`);
  }
  // Stable Google Doc IDs are identity pointers, never the source of profile content.
  const profileFile: GoogleDriveFile = { id: entry.docId, name: entry.slug + " Profile", mimeType: GOOGLE_DOC_MIME };
  const bytes = await retry(entry.slug + " Google Doc", () => downloadGoogleDriveFile(auth, profileFile));
  const body = bytes.toString("utf8");
  // Fail closed instead of accidentally replacing a complete profile with a login/error page.
  if (!/(?:^|\n)\s*ABOUT ME\s*(?:\n|$)/i.test(body) ||
      !/(?:^|\n)\s*NAME\s*(?:\n|$)/i.test(body)) {
    throw new Error(`Google Doc ${entry.docId} is not a valid SAM profile; preserving published data.`);
  }
  const profile = parseDriveProfile(body, existing.name, existing.affiliation);
  if (!profile.name || profile.name.length > 120) throw new Error(`Invalid profile name: ${entry.slug}`);
  // Never write role, sort order, awards, education, grants, publications, research-area
  // connections, custom Mahbub sections, or other curated relations.
  const update = {
    name: profile.name,
    title: profile.title,
    affiliation: profile.affiliation,
    email: profile.email || null,
    bio: profile.bio || null,
    researchSummary: profile.researchSummary || null,
    researchInterests: profile.researchInterests || null,
    website: profile.website || null,
    googleScholar: profile.googleScholar || null,
    inspire: profile.inspire || null,
    orcid: profile.orcid || null,
    github: profile.github || null,
    linkedin: profile.linkedin || null,
    contentSource: "DRIVE_LEADER",
    externalSourceId: entry.docId,
    sourceUpdatedAt: new Date(),
  };

  // Optional images and CVs: preserve existing local media unless replacements are present.
  let files: GoogleDriveFile[] = [];
  try { files = await retry(entry.slug + " folder", () => listGoogleDriveChildren(auth, entry.folderId)); }
  catch (e) { console.warn(`[leaders] Optional media listing unavailable for ${entry.slug}: ${String(e)}`); }
  const image = files
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f.name) || /image\/(png|jpeg|webp)/i.test(f.mimeType))
    .sort((a, b) => portraitRank(b.name) - portraitRank(a.name) || a.name.localeCompare(b.name))[0];
  const cv = files
    .filter(f => /\.pdf$/i.test(f.name) || f.mimeType === "application/pdf")
    .sort((a, b) => cvRank(b.name) - cvRank(a.name) || a.name.localeCompare(b.name))[0];
  // The portrait component uses person.photo before its dynamic route.
  // Set photo to null only when a new Drive image replaces the local fallback.
  if (image) Object.assign(update, { photo: null });
  // Verify the actual file bytes: Google Drive public downloads may return an HTML login/interstitial page with HTTP 200.
  if (image) {
    const b = await retry(entry.slug + " portrait", () => downloadGoogleDriveFile(auth, image));
    const safeExt = imageExtensionFromBytes(b);
    const dir = path.join(imgRoot, entry.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "profile" + safeExt), b);
    console.log(`[leaders] Portrait verified: ${entry.slug}, ${b.length} bytes, ${safeExt}`);
    for (const other of await readdir(dir)) {
      if (/^profile\.(jpe?g|png|webp)$/i.test(other) && other !== "profile" + safeExt) {
        await unlink(path.join(dir, other));
      }
    }
  }
  if (cv) {
    const b = await retry(entry.slug + " CV", () => downloadGoogleDriveFile(auth, cv));
    validatePdf(b);
    await mkdir(uploadRoot, { recursive: true });
    await writeFile(path.join(uploadRoot, entry.slug + "-cv.pdf"), b);
    console.log(`[leaders] CV verified: ${entry.slug}, ${b.length} bytes`);
    await prisma.person.update({ where: { slug: entry.slug }, data: { ...update, cvUrl: "/uploads/" + entry.slug + "-cv.pdf" } });
  } else {
    await prisma.person.update({ where: { slug: entry.slug }, data: update });
  }
  console.log(`[leaders] Synced ${entry.slug} from Google Docs (preserved existing curated sections)`);
}

async function main() {
  const account = readGoogleServiceAccount();
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  const auth: GoogleDriveAuth | null = account ? { type: "bearer", value: await getGoogleDriveAccessToken(account) } : key ? { type: "apiKey", value: key } : null;
  console.log(`[leaders] Access mode: ${auth?.type || "public-link"}; ${config.length} existing profiles`);
  let successful = 0;
  const errors: string[] = [];
  for (const entry of config) {
    try { await syncOne(auth, entry); successful++; }
    catch (error) { errors.push(entry.slug); console.error(`[leaders] Failed ${entry.slug}:`, error); }
  }
  console.log(`[leaders] Finished: ${successful} synced, ${errors.length} failed.`);
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error("[leaders] Fatal sync failure:", error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
