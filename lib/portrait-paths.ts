import path from "node:path";

/** Which portrait locations may be used by each content source. */
export function portraitDirectories(contentSource: string, slug: string, driveRoot = "data/drive-people", localRoot = "public/people") {
  const driveDir = path.resolve(driveRoot, slug);
  const localDir = path.resolve(localRoot, slug);
  // Leaders' Drive folders are authoritative: deleting a photo must reveal initials,
  // not the old picture still retained as an archival repository asset.
  if (contentSource === "DRIVE_LEADER" || contentSource === "DRIVE_LEADER_AUTO") return [driveDir];
  if (contentSource === "DRIVE") return [driveDir, localDir];
  return [localDir, driveDir];
}
