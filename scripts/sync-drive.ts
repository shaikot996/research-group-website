import { mkdir, readdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseDriveProfile, slugifyDriveName } from "../lib/drive-profile";
import { extractDocxText } from "../lib/docx-text";
import { downloadGoogleDriveFile, getGoogleDriveAccessToken, GOOGLE_DOC_MIME, GOOGLE_DRIVE_FOLDER_MIME, listGoogleDriveChildren, readGoogleServiceAccount, type GoogleDriveAuth, type GoogleDriveFile } from "../lib/google-drive";

if (process.env.NODE_ENV !== "production") {
  try { process.loadEnvFile(".env"); } catch { /* CI may provide env directly. */ }
}

const prisma = new PrismaClient();
const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "10_rzMMevZi6_T-bajAnmaynab0UbDBtv";
const explicitRaFolderId = process.env.GOOGLE_DRIVE_RA_FOLDER_ID?.trim();
const assetRoot = path.resolve(process.env.DRIVE_PEOPLE_ASSET_DIR || "data/drive-people");
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "data/uploads");
const defaultAffiliation = process.env.DRIVE_DEFAULT_AFFILIATION || "BRAC University";
const optional = process.argv.includes("--optional");
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function scoreByName(file: GoogleDriveFile, pattern: RegExp) { return pattern.test(file.name.toLowerCase()) ? 10 : 0; }

function profileFileScore(file: GoogleDriveFile) {
  let score = scoreByName(file, /about|profile|bio|research|info/) * 5;
  if (/sam[\s_-]*research[\s_-]*assistant[\s_-]*profile/i.test(file.name)) score += 60;
  if (file.mimeType === DOCX_MIME || /\.docx$/i.test(file.name)) score += 100;
  else if (file.mimeType === GOOGLE_DOC_MIME) score += 10;
  else score += 5;
  return score;
}

function chooseProfileFile(files: GoogleDriveFile[]) {
  const supported = files.filter(file =>
    file.mimeType === GOOGLE_DOC_MIME ||
    file.mimeType === DOCX_MIME ||
    file.mimeType === "text/plain" ||
    /\.(?:txt|docx)$/i.test(file.name),
  );
  return supported.sort((a, b) => {
    const byScore = profileFileScore(b) - profileFileScore(a);
    if (byScore) return byScore;
    const aTime = a.modifiedTime ? Date.parse(a.modifiedTime) : 0;
    const bTime = b.modifiedTime ? Date.parse(b.modifiedTime) : 0;
    return bTime - aTime;
  })[0];
}

function isDocxProfile(file: GoogleDriveFile) {
  return file.mimeType === DOCX_MIME || /\.docx$/i.test(file.name);
}

async function readProfileText(auth: GoogleDriveAuth | null, file: GoogleDriveFile | undefined) {
  if (!file) return "";
  const bytes = await downloadGoogleDriveFile(auth, file);
  return isDocxProfile(file) ? extractDocxText(bytes) : bytes.toString("utf8");
}
function choosePortrait(files: GoogleDriveFile[]) {
  const supported = files.filter(file =>
    (file.mimeType.startsWith("image/") && /image\/(jpeg|png|webp)/i.test(file.mimeType)) || /\.(jpe?g|png|webp)$/i.test(file.name),
  );
  return supported.sort((a,b) => scoreByName(b, /portrait|profile|photo|pic|headshot/) - scoreByName(a, /portrait|profile|photo|pic|headshot/))[0];
}
function chooseCv(files: GoogleDriveFile[]) {
  const supported = files.filter(file => file.mimeType === "application/pdf" || /\.pdf$/i.test(file.name));
  return supported.sort((a,b) => scoreByName(b, /(^|[^a-z])(cv|resume|curriculum)([^a-z]|$)/) - scoreByName(a, /(^|[^a-z])(cv|resume|curriculum)([^a-z]|$)/))[0];
}

async function findRaFolder(auth: GoogleDriveAuth | null) {
  if (explicitRaFolderId) return explicitRaFolderId;
  const rootChildren = await listGoogleDriveChildren(auth, rootFolderId);
  const folders = rootChildren.filter(file => file.mimeType === GOOGLE_DRIVE_FOLDER_MIME);
  const preferred = folders.find(file => /research\s*assist/i.test(file.name));
  if (preferred) return preferred.id;
  // The shared root may itself be the RA container and can also contain future
  // top-level sections such as News or Events. Those section folders are
  // filtered out below rather than forcing an additional RA wrapper folder.
  return rootFolderId;
}

async function chooseSlug(externalId: string, name: string) {
  const existing = await prisma.person.findUnique({ where: { externalSourceId: externalId }, select: { slug: true } });
  if (existing) return existing.slug;
  const base = slugifyDriveName(name);
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const row = await prisma.person.findUnique({ where: { slug: candidate }, select: { contentSource: true } });
    if (!row) return candidate;
    if (row.contentSource === "DRIVE_BOOTSTRAP" && candidate === base) return candidate;
    if (row.contentSource === "DRIVE") continue;
  }
  throw new Error(`Unable to allocate a unique slug for ${name}.`);
}

async function savePortrait(auth: GoogleDriveAuth | null, file: GoogleDriveFile | undefined, slug: string) {
  const dir = path.join(assetRoot, slug);
  await mkdir(dir, { recursive: true });
  for (const existing of await readdir(dir).catch(() => [] as string[])) {
    if (/^profile\.(jpe?g|png|webp)$/i.test(existing)) await unlink(path.join(dir, existing)).catch(() => undefined);
  }
  if (!file) return;
  const nameExt = path.extname(file.name).toLowerCase();
  const ext = file.mimeType === "image/png" || nameExt === ".png"
    ? ".png"
    : file.mimeType === "image/webp" || nameExt === ".webp"
      ? ".webp"
      : nameExt === ".jpeg" ? ".jpeg" : ".jpg";
  await writeFile(path.join(dir, `profile${ext}`), await downloadGoogleDriveFile(auth, file));
}

async function saveCv(auth: GoogleDriveAuth | null, file: GoogleDriveFile | undefined, slug: string) {
  await mkdir(uploadRoot, { recursive: true });
  const target = path.join(uploadRoot, `${slug}-cv.pdf`);
  if (!file) {
    await unlink(target).catch(() => undefined);
    return null;
  }
  await writeFile(target, await downloadGoogleDriveFile(auth, file));
  return `/uploads/${slug}-cv.pdf`;
}

async function syncPerson(auth: GoogleDriveAuth | null, folder: GoogleDriveFile) {
  const files = await listGoogleDriveChildren(auth, folder.id);
  const profileFile = chooseProfileFile(files);
  const portrait = choosePortrait(files);
  const cv = chooseCv(files);
  if (!profileFile && !portrait && !cv) {
    console.warn(`[drive] Skipping empty/incomplete folder: ${folder.name}`);
    return null;
  }
  const text = await readProfileText(auth, profileFile);
  const profile = parseDriveProfile(text, folder.name, defaultAffiliation);
  const slug = await chooseSlug(folder.id, profile.name);
  const collision = await prisma.person.findUnique({ where: { slug }, select: { id: true, contentSource: true, externalSourceId: true } });
  if (collision && !["DRIVE", "DRIVE_BOOTSTRAP"].includes(collision.contentSource) && collision.externalSourceId !== folder.id) {
    console.warn(`[drive] Reserved local slug collision for ${folder.name} (${slug}); skipping to protect local profile.`);
    return null;
  }
  await savePortrait(auth, portrait, slug);
  const cvUrl = await saveCv(auth, cv, slug);
  const sourceUpdatedAt = [folder.modifiedTime, profileFile?.modifiedTime, portrait?.modifiedTime, cv?.modifiedTime].filter(Boolean).sort().at(-1);
  const common = {
    name: profile.name,
    role: "RESEARCH_ASSISTANT",
    title: profile.title,
    affiliation: profile.affiliation,
    email: profile.email || null,
    photo: null,
    bio: profile.bio || null,
    researchSummary: profile.researchSummary || null,
    researchInterests: profile.researchInterests || null,
    website: profile.website || null,
    googleScholar: profile.googleScholar || null,
    inspire: profile.inspire || null,
    orcid: profile.orcid || null,
    github: profile.github || null,
    linkedin: profile.linkedin || null,
    cvUrl,
    contentSource: "DRIVE",
    externalSourceId: folder.id,
    profileSections: Object.keys(profile.sections).length ? JSON.stringify(profile.sections) : null,
    sourceUpdatedAt: sourceUpdatedAt ? new Date(sourceUpdatedAt) : new Date(),
    status: "PUBLISHED",
    featured: false,
  };
  const existingByExternalId = await prisma.person.findUnique({ where: { externalSourceId: folder.id }, select: { id: true } });
  const bootstrap = !existingByExternalId
    ? await prisma.person.findFirst({ where: { slug, contentSource: "DRIVE_BOOTSTRAP" }, select: { id: true } })
    : null;
  const existing = existingByExternalId || bootstrap;
  if (existing) {
    await prisma.person.update({ where: { id: existing.id }, data: common });
  } else {
    await prisma.person.create({ data: { ...common, slug, sortOrder: 1000 } });
  }
  console.log(`[drive] Synced ${profile.name} -> /people/${slug}`);
  return folder.id;
}

async function main() {
  const account = readGoogleServiceAccount();
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  let auth: GoogleDriveAuth | null = null;
  if (account) auth = { type: "bearer", value: await getGoogleDriveAccessToken(account) };
  else if (apiKey) auth = { type: "apiKey", value: apiKey };
  console.log(`[drive] Access mode: ${auth?.type || "public-link"}`);
  await mkdir(assetRoot, { recursive: true });
  await mkdir(uploadRoot, { recursive: true });
  const raFolderId = await findRaFolder(auth);
  const children = (await listGoogleDriveChildren(auth, raFolderId)).filter(file =>
    file.mimeType === GOOGLE_DRIVE_FOLDER_MIME && !/^(news(?:\s*(?:&|and)\s*events?)?|events?(?:\s*(?:&|and)\s*news)?|templates?|shared|media)$/i.test(file.name.trim()),
  );
  const seen = new Set<string>();
  for (const folder of children) {
    seen.add(folder.id); // discovery succeeded; transient file errors must not unpublish an existing profile
    try {
      await syncPerson(auth, folder);
    } catch (error) {
      console.error(`[drive] Failed to sync ${folder.name}:`, error);
    }
  }
  const activeDrivePeople = await prisma.person.findMany({ where: { contentSource: "DRIVE" }, select: { id: true, slug: true, externalSourceId: true } });
  for (const person of activeDrivePeople) {
    if (person.externalSourceId && !seen.has(person.externalSourceId)) {
      await prisma.person.update({ where: { id: person.id }, data: { status: "DRAFT" } });
      await rm(path.join(assetRoot, person.slug), { recursive: true, force: true });
      await unlink(path.join(uploadRoot, `${person.slug}-cv.pdf`)).catch(() => undefined);
      console.log(`[drive] Unpublished missing Drive profile ${person.slug}`);
    }
  }
  console.log(`[drive] Complete: ${seen.size} Research Assistant profile(s) active.`);
}

main().catch(error => {
  if (optional) console.error("[drive] Sync unavailable; keeping existing/bootstrap profiles:", error);
  else { console.error(error); process.exitCode = 1; }
}).finally(async () => prisma.$disconnect());
