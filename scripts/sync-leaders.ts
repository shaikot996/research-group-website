import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { resolveInspireUrl } from "../lib/verified-inspire-profiles";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseDriveProfile, slugifyDriveName } from "../lib/drive-profile";
import { extractDocxText } from "../lib/docx-text";
import { imageExtensionFromBytes, validatePdf, portraitRank, cvRank } from "../lib/drive-leader-media";
import { candidatePersonFolders, chooseLeaderDocument, isDocxLeaderDocument, isPlaceholderPersonFolder, isValidLeaderDocument, normalizePersonIdentity } from "../lib/drive-leader-discovery";
import {
  downloadGoogleDriveFile, getGoogleDriveAccessToken, GOOGLE_DOC_MIME,
  listGoogleDriveChildren, readGoogleServiceAccount,
  type GoogleDriveAuth, type GoogleDriveFile,
} from "../lib/google-drive";

if (process.env.NODE_ENV !== "production") {
  try { process.loadEnvFile(".env"); } catch { /* CI provides environment */ }
}
const prisma = new PrismaClient();
const piRoot = process.env.GOOGLE_DRIVE_PI_FOLDER_ID?.trim() || "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc";
const copiRoot = process.env.GOOGLE_DRIVE_COPI_FOLDER_ID?.trim() || "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM";
const facultyRoot = process.env.GOOGLE_DRIVE_FACULTY_FOLDER_ID?.trim() || "1cDxQKvnfbPdoqv3uFqGsw0iGZDGPyv71";
const imgRoot = path.resolve(process.env.DRIVE_PEOPLE_ASSET_DIR || "data/drive-people");
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "data/uploads");

type LeaderRole = "PRINCIPAL_INVESTIGATOR" | "RESEARCHER" | "FACULTY";
type LeaderEntry = {
  slug?: string;
  docId: string;
  folderId: string;
  folderName: string;
  role: LeaderRole;
  curated: boolean;
  document?: GoogleDriveFile;
};

// Stable pointers for the existing curated members. Their roles, research
// highlights, grants, awards, education, relations and slugs are never reset.
const curated = [
  { slug: "mahbubul-alam-majumdar", docId: "1EdG_uw-eW_lVNvcNMz__uWydIqPfywP6Q1GhM46veKo", folderId: "1cnZuSFd6ZVKe7T2AUqXNokDya7mkRMle", folderName: "Mahbubul Alam Majumdar", role: "PRINCIPAL_INVESTIGATOR", curated: true },
  { slug: "syed-hasibul-hassan-chowdhury", docId: "1lPvsr33Wv1RGvn_530ogjKqEJ8D_mjFn5S-nuP3iJDw", folderId: "1dWR5wvM9GuQyG_CPezk__8dkrhgB2BiW", folderName: "Syed Hasibul Hassan Chowdhury", role: "PRINCIPAL_INVESTIGATOR", curated: true },
  { slug: "ahmed-rakin-kamal", docId: "1J2pOnHjX7U3t_aiIpt3NznvyZ0jPZ63Yq_iNX4IMP8I", folderId: "1f8VaS6z-YIqkIrvtUxcn4uKEXVe6Pamp", folderName: "Ahmed Rakin Kamal", role: "RESEARCHER", curated: true },
  { slug: "mishaal-hai", docId: "1E1OcVzUsomwMsFjYzhqOZnBKPuodFthSm6Z5VvW-ESs", folderId: "1rJrAJmhUwMvjSQCELBJbK2jnVO_kOiKH", folderName: "Mishaal Hai", role: "RESEARCHER", curated: true },
  { slug: "sayeda-tashnuba-jahan", docId: "1_I5KhyqwxLQoiwhJP70N_RTTPLpAs_-OtDWKysrY7yk", folderId: "1Eixc5Qtjw9GFczqQzQlG4iJIbP7cygKs", folderName: "Sayeda Tashnuba Jahan", role: "FACULTY", curated: true },
  { slug: "md-shaikot-jahan-shuvo", docId: "1JfqtGltntXeJpLebHI2MfV4X5OfKFBn5id0MnmWZlBs", folderId: "1U0JuxDwdIVyxDD_sgLa2qHoVQ-gGLEM1", folderName: "Md Shaikot Jahan Shuvo", role: "RESEARCHER", curated: true },
] satisfies LeaderEntry[];

async function retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fn(); }
    catch (error) {
      last = error;
      if (attempt < 3) {
        console.warn("[leaders] Retry " + attempt + "/3 for " + label + ": " + String(error));
        await new Promise(resolve => setTimeout(resolve, 900 * attempt));
      }
    }
  }
  throw last;
}

async function discoverLeaders(auth: GoogleDriveAuth | null) {
  const entries: LeaderEntry[] = [...curated];
  const knownFolders = new Set(curated.map(person => person.folderId));
  // Both roots must be readable before a new snapshot is considered valid.
  for (const { rootId, role, section } of [
    { rootId: piRoot, role: "PRINCIPAL_INVESTIGATOR" as const, section: "PI" },
    { rootId: copiRoot, role: "RESEARCHER" as const, section: "Co-PI" },
    { rootId: facultyRoot, role: "FACULTY" as const, section: "Faculty" },
  ]) {
    const children = await retry(section + " folder discovery", () => listGoogleDriveChildren(auth, rootId));
    for (const folder of children.filter(file => file.mimeType === "application/vnd.google-apps.folder")) {
      if (isPlaceholderPersonFolder(folder.name)) {
        console.log("[leaders] Ignoring placeholder " + section + " folder: " + folder.name);
      }
    }
    const folders = candidatePersonFolders(children);
    console.log("[leaders] " + section + " discovered " + folders.length + " member folders.");
    for (const folder of folders) {
      if (knownFolders.has(folder.id)) continue;
      const files = await retry(section + " listing " + folder.name, () => listGoogleDriveChildren(auth, folder.id));
      const document = chooseLeaderDocument(files);
      if (!document) {
        console.log("[leaders] Skipping " + section + " folder without a Google Doc/DOCX/TXT profile: " + folder.name);
        continue;
      }
      entries.push({
        folderId: folder.id,
        folderName: folder.name,
        docId: document.id,
        role,
        document,
        curated: false,
      });
    }
  }
  return entries;
}

async function syncOne(auth: GoogleDriveAuth | null, entry: LeaderEntry): Promise<boolean> {
  // An RA may move into the researcher section without becoming a Co-PI.
  // Adopt the previous DRIVE/DRIVE_BOOTSTRAP row by stable slug: preserve its
  // public URL and avoid an incorrectly duplicated member.
  const movedWalid = !entry.curated && entry.folderId === "1bAsyI9_ih9iNGn2Ej4jN3jGepksD0Rbs";
  const existing = entry.curated
    ? await prisma.person.findUnique({ where: { slug: entry.slug! } })
    : (await prisma.person.findUnique({ where: { externalSourceId: entry.docId } })) ||
      (movedWalid ? await prisma.person.findUnique({ where: { slug: "walid-hasan" } }) : null);

  if (entry.curated && (!existing || !["PRINCIPAL_INVESTIGATOR", "RESEARCHER", "FACULTY"].includes(existing.role))) {
    throw new Error("Expected curated leader missing or wrong role: " + entry.slug);
  }
  if (existing && !entry.curated && existing.contentSource !== "DRIVE_LEADER_AUTO" &&
    !(movedWalid && ["DRIVE","DRIVE_BOOTSTRAP","LOCAL"].includes(existing.contentSource))) {
    console.warn("[leaders] Profile already owned by a curated/local source; skipping " + entry.folderName);
    return false;
  }

  const profileFile: GoogleDriveFile = entry.document ?? {
    id: entry.docId,
    name: entry.folderName + " Profile",
    mimeType: GOOGLE_DOC_MIME,
  };
  const raw = await retry(entry.folderName + " profile document", () => downloadGoogleDriveFile(auth, profileFile));
  const body = isDocxLeaderDocument(profileFile) ? extractDocxText(raw) : raw.toString("utf8");
  if (!isValidLeaderDocument(body)) {
    if (entry.curated) throw new Error("Invalid curated Google Doc " + entry.docId);
    console.warn("[leaders] Skipping incomplete profile headings in " + entry.folderName);
    return false;
  }

  const profile = parseDriveProfile(body, existing?.name || entry.folderName, existing?.affiliation || "BRAC University");
  if (!profile.name.trim() || profile.name.length > 120 || isPlaceholderPersonFolder(profile.name)) {
    console.warn("[leaders] Skipping invalid name in " + entry.folderName);
    return false;
  }
  const slug = existing?.slug || slugifyDriveName(profile.name);
  if (!existing) {
    const people = await prisma.person.findMany({
      select: { slug: true, name: true, email: true, inspire: true, externalSourceId: true },
    });
    const duplicate = people.find(person =>
      person.slug === slug ||
      normalizePersonIdentity(person.name) === normalizePersonIdentity(profile.name) ||
      (profile.email && person.email && profile.email.toLowerCase() === person.email.toLowerCase()) ||
      (profile.inspire && person.inspire && profile.inspire === person.inspire)
    );
    if (duplicate) {
      console.warn("[leaders] Skipping duplicate person " + profile.name + " (already " + duplicate.slug + ")");
      return false;
    }
  }

  // The selected profile belongs to the PI or Co-PI folder. Do not classify
  // a new leader as a Research Assistant merely because the title is empty.
  const titleFromDoc = /(?:^|\n)\s*(?:CURRENT POSITION|POSITION|TITLE)\s*(?:\n|:)/i.test(body);
  const title = movedWalid
    ? (titleFromDoc ? profile.title : "Researcher")
    : titleFromDoc ? profile.title :
      entry.role === "PRINCIPAL_INVESTIGATOR" ? "Principal Investigator" : entry.role === "FACULTY" ? "Faculty" : "Co-Principal Investigator";
  const files = await retry(entry.folderName + " media listing", () => listGoogleDriveChildren(auth, entry.folderId));
  const photo = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f.name) || /image\/(png|jpeg|webp)/i.test(f.mimeType))
    .sort((a, b) => portraitRank(b.name) - portraitRank(a.name) || a.name.localeCompare(b.name))[0];
  const cv = files.filter(f => /\.pdf$/i.test(f.name) || f.mimeType === "application/pdf")
    .sort((a, b) => cvRank(b.name) - cvRank(a.name) || a.name.localeCompare(b.name))[0];

  // Validate complete downloads BEFORE modifying any existing profile data.
  const photoBytes = photo ? await retry(entry.folderName + " portrait", () => downloadGoogleDriveFile(auth, photo)) : null;
  const photoExt = photoBytes ? imageExtensionFromBytes(photoBytes) : null;
  const cvBytes = cv ? await retry(entry.folderName + " CV", () => downloadGoogleDriveFile(auth, cv)) : null;
  if (cvBytes) validatePdf(cvBytes);

  const imageDir = path.join(imgRoot, slug);
  await mkdir(imageDir, { recursive: true });
  if (photoBytes && photoExt) await writeFile(path.join(imageDir, "profile" + photoExt), photoBytes);
  for (const filename of await readdir(imageDir)) {
    if (/^profile\.(jpe?g|png|webp)$/i.test(filename) && filename !== "profile" + photoExt) {
      await unlink(path.join(imageDir, filename));
    }
  }
  const cvPath = path.join(uploadRoot, slug + "-cv.pdf");
  if (cvBytes) {
    await mkdir(uploadRoot, { recursive: true });
    await writeFile(cvPath, cvBytes);
  } else if (!entry.curated) {
    await unlink(cvPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  const update = {
    name: profile.name,
    title,
    affiliation: profile.affiliation,
    email: profile.email || null,
    bio: profile.bio || null,
    researchSummary: profile.researchSummary || null,
    researchInterests: profile.researchInterests || null,
    website: profile.website || null,
    googleScholar: profile.googleScholar || null,
    inspire: resolveInspireUrl(profile.inspire || existing?.inspire, slug),
    orcid: profile.orcid || null,
    github: profile.github || null,
    linkedin: profile.linkedin || null,
    // Drive media is authoritative for every synced leader. Never restore
    // a stale repository profile image after a successful Drive sync.
    photo: null,
    cvUrl: cvBytes ? "/uploads/" + slug + "-cv.pdf" : entry.curated ? existing?.cvUrl || null : null,
    externalSourceId: entry.docId,
    contentSource: entry.curated ? "DRIVE_LEADER" : "DRIVE_LEADER_AUTO",
    sourceUpdatedAt: new Date(),
  };

  if (existing) {
    await prisma.person.update({
      where: { id: existing.id },
      data: {
        ...update,
        ...(!entry.curated ? {
          status: "PUBLISHED",
          role: entry.role,
          profileSections: Object.keys(profile.sections).length ? JSON.stringify(profile.sections) : null,
        } : {}),
      },
    });
  } else {
    await prisma.person.create({
      data: {
        ...update,
        slug,
        role: entry.role,
        status: "PUBLISHED",
        featured: false,
        sortOrder: 900,
        profileSections: Object.keys(profile.sections).length ? JSON.stringify(profile.sections) : null,
      },
    });
  }
  console.log("[leaders] Synced " + (entry.curated ? "curated " : "new ") + entry.folderName + " -> /people/" + slug);
  return true;
}

async function main() {
  const account = readGoogleServiceAccount();
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  const auth: GoogleDriveAuth | null = account
    ? { type: "bearer", value: await getGoogleDriveAccessToken(account) }
    : key ? { type: "apiKey", value: key } : null;

  console.log("[leaders] Access mode: " + (auth?.type || "public-link"));
  const entries = await discoverLeaders(auth);
  const encountered = new Set(entries.filter(entry => !entry.curated).map(entry => entry.docId));
  const failures: string[] = [];
  let successful = 0;
  let skipped = 0;
  for (const entry of entries) {
    try {
      if (await syncOne(auth, entry)) successful++;
      else skipped++;
    } catch (error) {
      failures.push(entry.folderName);
      console.error("[leaders] Failed to sync " + entry.folderName + ": ", error);
    }
  }

  // A missing folder unpublishes ONLY an automatically created leader.
  // Never unpublish fixed/curated researchers. Skip archival on partial errors.
  if (!failures.length) {
    const autoPeople = await prisma.person.findMany({
      where: { contentSource: "DRIVE_LEADER_AUTO" },
      select: { id: true, name: true, externalSourceId: true, status: true },
    });
    for (const person of autoPeople) {
      if (person.externalSourceId && !encountered.has(person.externalSourceId) && person.status === "PUBLISHED") {
        await prisma.person.update({ where: { id: person.id }, data: { status: "DRAFT" } });
        console.log("[leaders] Unpublished removed Drive leader " + person.name);
      }
    }
  }

  console.log("[leaders] Finished: " + successful + " synced, " + skipped + " skipped, " +
    failures.length + " failed; " + entries.length + " discovered.");
  if (failures.length) process.exitCode = 1;
}
main().catch(error => {
  console.error("[leaders] Fatal Drive leader sync failure: ", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
