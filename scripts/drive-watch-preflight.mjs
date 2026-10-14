/**
 * Preflight for the continuously running GitHub Actions Drive watcher.
 * Verifies existing secret and folder permissions before entering the loop.
 */
import {
  readGoogleServiceAccount,
  getGoogleDriveAccessToken,
  listGoogleDriveChildren,
} from "../lib/google-drive.ts";

const roots = [
  ["Research Assistant", "10_rzMMevZi6_T-bajAnmaynab0UbDBtv"],
  ["Principal Investigator", "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc"],
  ["Co-Principal Investigator", "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM"],
];
const account = readGoogleServiceAccount();
if (!account) throw new Error("Missing existing Google service account secret.");
const auth = { type: "bearer", value: await getGoogleDriveAccessToken(account) };
for (const [name, id] of roots) {
  const files = await listGoogleDriveChildren(auth, id);
  console.log("[watch-preflight] " + name + " folder accessible: " + files.length + " direct items.");
}
console.log("[watch-preflight] Authentication and all three root folders verified.");
