import assert from "node:assert/strict";
import { driveFingerprint } from "../lib/drive-watch-state.mjs";

const RA = "ra-root";
const PI = "pi-root";
const COPI = "copi-root";
const folderMime = "application/vnd.google-apps.folder";
let drive = {
  [RA]: [
    { id: "ra-person", name: "Sample RA", mimeType: folderMime, modifiedTime: "2026-01-01" },
  ],
  "ra-person": [
    { id: "doc-ra", name: "About Me", mimeType: "application/vnd.google-apps.document", modifiedTime: "2026-01-01T00:00:00Z" },
  ],
  [PI]: [
    { id: "pi-person", name: "Sample PI", mimeType: folderMime },
  ],
  "pi-person": [
    { id: "doc-pi", name: "Profile", mimeType: "application/vnd.google-apps.document", modifiedTime: "2026-01-01T00:00:00Z" },
  ],
  [COPI]: [],
};
const listChildren = async (id) => structuredClone(drive[id] || []);
const roots = [RA, PI, COPI];
const first = await driveFingerprint(roots, listChildren);
assert.equal(first.count, 4);
assert.equal(first.folders, 5);
const unchanged = await driveFingerprint(roots, listChildren);
assert.equal(first.digest, unchanged.digest);

// Folder listing order cannot affect a fingerprint.
drive[RA].reverse();
assert.equal((await driveFingerprint(roots, listChildren)).digest, first.digest);

drive["ra-person"][0].modifiedTime = "2026-01-01T00:05:00Z";
const edited = await driveFingerprint(roots, listChildren);
assert.notEqual(first.digest, edited.digest, "document edit must be detected");
drive["ra-person"].push({id:"cv-ra",name:"CV.pdf",mimeType:"application/pdf",size:"1024"});
const created = await driveFingerprint(roots, listChildren);
assert.notEqual(edited.digest, created.digest, "new files must be detected");
drive["ra-person"].pop();
assert.equal((await driveFingerprint(roots,listChildren)).digest, edited.digest, "deletion must be detected");
drive[PI].push({id:"pi-new",name:"New PI",mimeType:folderMime});
assert.notEqual((await driveFingerprint(roots,listChildren)).digest,edited.digest,"new nested folders must be detected");

await assert.rejects(() => driveFingerprint(roots, listChildren, { maxNodes: 2 }), /safety limit/);
await assert.rejects(() => driveFingerprint(roots, listChildren, { maxDepth: 0 }), /depth limit/);
console.log("GitHub-native Drive watcher tests passed (unchanged, edits, new/deleted files, folders, safety limits).");
