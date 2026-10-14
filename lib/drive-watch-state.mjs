import { createHash } from "node:crypto";

/** Stable digest of a Drive subtree's identities and last-modified metadata. */
export async function driveFingerprint(roots, listChildren, options = {}) {
  const maxDepth = options.maxDepth ?? 8;
  const maxNodes = options.maxNodes ?? 3000;
  const seen = new Set();
  const rows = [];
  const folderMime = "application/vnd.google-apps.folder";

  async function visit(folderId, depth) {
    if (seen.has(folderId)) return;
    if (depth > maxDepth) throw new Error("Drive watch folder-depth limit exceeded.");
    seen.add(folderId);
    const children = await listChildren(folderId);
    for (const file of children) {
      rows.push([
        folderId, file.id, file.name, file.mimeType,
        file.modifiedTime || "", file.size || "",
      ].join("\u001f"));
      if (rows.length > maxNodes) throw new Error("Drive watch item count exceeded safety limit.");
      if (file.mimeType === folderMime) await visit(file.id, depth + 1);
    }
  }
  for (const root of roots) await visit(root, 0);
  rows.sort();
  return {
    digest: createHash("sha256").update(rows.join("\n")).digest("hex"),
    count: rows.length,
    folders: seen.size,
  };
}
