/**
 * Preflight for the continuously running GitHub Actions Drive watcher.
 * Verifies existing secret and folder permissions before entering the loop.
 */
import {
  readWatchServiceAccount,
  getWatchDriveAccessToken,
  listWatchDriveChildren,
} from "../lib/drive-watch-api.mjs";

const roots = [
  ["Research Assistant", "10_rzMMevZi6_T-bajAnmaynab0UbDBtv"],
  ["Principal Investigator", "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc"],
  ["Co-Principal Investigator", "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM"],
  ["News and Events", "19frcFmQJsFFA3xU6TqiypUvEeuVZ2fi6"],
];
const account = readWatchServiceAccount();
if (!account) throw new Error("Missing existing Google service account secret.");
const auth = await getWatchDriveAccessToken(account);
for (const [name, id] of roots) {
  const files = await listWatchDriveChildren(auth, id);
  console.log("[watch-preflight] " + name + " folder accessible: " + files.length + " direct items.");
}
console.log("[watch-preflight] Authentication and all three root folders verified.");
