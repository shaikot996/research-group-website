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

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export function isDocxLeaderDocument(file: GoogleDriveFile) {
  // Google Drive allows native Docs to retain a .docx suffix after conversion.
  // The MIME type is authoritative: native Docs export as UTF-8 text, not ZIP.
  if (file.mimeType === GOOGLE_DOC_MIME) return false;
  return file.mimeType === DOCX_MIME || /\.docx$/i.test(file.name);
}
export function chooseLeaderDocument(files: GoogleDriveFile[]): GoogleDriveFile | undefined {
  return files
    .filter(file => file.mimeType === GOOGLE_DOC_MIME || isDocxLeaderDocument(file) || file.mimeType === "text/plain")
    .sort((a, b) => {
      const score = (f: GoogleDriveFile) =>
        /(?:profile|about|biography|bio|info)/i.test(f.name) ? 10 : 0;
      return score(b) - score(a) || b.name.localeCompare(a.name);
    })[0];
}

export function isValidLeaderDocument(body: string): boolean {
  return /(?:^|\n)\s*NAME\s*(?::\s*\S.*|\n|$)/i.test(body) &&
    /(?:^|\n)\s*ABOUT ME\s*(?::\s*\S.*|\n|$)/i.test(body);
}

export function normalizePersonIdentity(name: string): string {
  return name.trim().normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
