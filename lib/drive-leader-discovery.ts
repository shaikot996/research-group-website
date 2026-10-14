import { GOOGLE_DOC_MIME, GOOGLE_DRIVE_FOLDER_MIME, type GoogleDriveFile } from "./google-drive";

/** Reserved/testing folders should never generate public member profiles. */
export function isPlaceholderPersonFolder(name: string): boolean {
  return /(?:^|[^a-z])(?:dummy|test(?:[\s_-]*folder)?|placeholder|template|sample)(?:$|[^a-z])/i.test(name);
}

export function candidatePersonFolders(files: GoogleDriveFile[]): GoogleDriveFile[] {
  return files
    .filter(file => file.mimeType === GOOGLE_DRIVE_FOLDER_MIME && !isPlaceholderPersonFolder(file.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function chooseLeaderDocument(files: GoogleDriveFile[]): GoogleDriveFile | undefined {
  return files
    .filter(file => file.mimeType === GOOGLE_DOC_MIME)
    .sort((a, b) => {
      const score = (f: GoogleDriveFile) =>
        /(?:profile|about|biography|bio|info)/i.test(f.name) ? 10 : 0;
      return score(b) - score(a) || b.name.localeCompare(a.name);
    })[0];
}

export function isValidLeaderDocument(body: string): boolean {
  return /(?:^|\n)\s*NAME\s*(?:\n|$)/i.test(body) &&
    /(?:^|\n)\s*ABOUT ME\s*(?:\n|$)/i.test(body);
}

export function normalizePersonIdentity(name: string): string {
  return name.trim().normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
