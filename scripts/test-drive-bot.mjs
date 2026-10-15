// Offline regression tests for the Google Apps Script Drive change dispatcher.
// Run with: node scripts/test-drive-bot.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

const script = readFileSync(new URL("./sam-drive-dispatch-bot.gs", import.meta.url), "utf8");
new vm.Script(script, { filename: "sam-drive-dispatch-bot.gs" });

const properties = new Map([["SAM_GITHUB_TOKEN", "fake-offline-token"]]);
const triggers = [];
const sent = [];
let shouldFailDispatch = false;
const now = Date.now();

const rootIds = [
  "10_rzMMevZi6_T-bajAnmaynab0UbDBtv",
  "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc",
  "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM",
  "1cDxQKvnfbPdoqv3uFqGsw0iGZDGPyv71"
];
const folders = new Map(rootIds.map((id) => [id, { id, name: "root", updated: 100, files: [], folders: [] }]));
folders.get(rootIds[0]).files.push({ id: "first-profile", name: "About Me", updated: 200, size: 100 });

function iterator(items) {
  let i = 0;
  return { hasNext: () => i < items.length, next: () => items[i++] };
}
function fileObject(file) {
  return {
    getId: () => file.id,
    getName: () => file.name,
    getLastUpdated: () => new Date(file.updated),
    getSize: () => file.size
  };
}
function folderObject(folder) {
  return {
    getId: () => folder.id,
    getName: () => folder.name,
    getLastUpdated: () => new Date(folder.updated),
    getFiles: () => iterator(folder.files.map(fileObject)),
    getFolders: () => iterator(folder.folders.map(folderObject))
  };
}
const propsApi = {
  getProperty: (key) => properties.get(key) || null,
  setProperties: (values) => {
    for (const [key, value] of Object.entries(values)) properties.set(key, String(value));
  }
};

const ctx = {
  DriveApp: { getFolderById: (id) => folderObject(folders.get(id)) },
  Utilities: {
    DigestAlgorithm: { SHA_256: "sha256" },
    computeDigest: (_algorithm, value) => [...createHash("sha256").update(value).digest()]
  },
  PropertiesService: { getScriptProperties: () => propsApi },
  ScriptApp: {
    getProjectTriggers: () => [...triggers],
    deleteTrigger: (trigger) => {
      const index = triggers.indexOf(trigger);
      if (index >= 0) triggers.splice(index, 1);
    },
    newTrigger: (handler) => ({
      timeBased: () => ({
        everyMinutes: (minutes) => ({
          create: () => triggers.push({ getHandlerFunction: () => handler, minutes })
        })
      })
    })
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  UrlFetchApp: {
    fetch: (url, options) => {
      sent.push({ url, options });
      return { getResponseCode: () => shouldFailDispatch ? 403 : 204 };
    }
  },
  Logger: { log: () => {} },
  Date, Math, String, Number, JSON, Error
};

const bot = vm.createContext(ctx);
new vm.Script(script).runInContext(bot);
assert.equal(bot.SAM_DRIVE_BOT_CONFIG.roots.length, 4);
assert.equal(bot.SAM_DRIVE_BOT_CONFIG.cooldownMilliseconds, 90000);

bot.installSamDriveBot();
assert.equal(sent.length, 1);
assert.equal(triggers.length, 1);
assert.equal(triggers[0].minutes, 1);
assert.equal(sent[0].options.method, "post");
assert.equal(JSON.parse(sent[0].options.payload).inputs.source, "drive-bot");
assert.ok(sent[0].url.includes("/actions/workflows/sync-drive.yml/dispatches"));

bot.checkSamDriveChanges();
assert.equal(sent.length, 1, "unchanged Drive must not trigger a deployment");

folders.get(rootIds[0]).files[0].updated += 1000;
properties.set("SAM_LAST_DRIVE_DISPATCH_MS", String(now));
bot.checkSamDriveChanges();
assert.equal(sent.length, 1, "debounce must prevent repeated builds");
properties.set("SAM_LAST_DRIVE_DISPATCH_MS", "0");
bot.checkSamDriveChanges();
assert.equal(sent.length, 2, "changed profile must trigger workflow");
bot.checkSamDriveChanges();
assert.equal(sent.length, 2, "successful dispatch must store snapshot");

folders.get(rootIds[1]).folders.push({ id: "new-pi-doc-folder", name: "Updated Profile", updated: 2000, files: [], folders: [] });
const previous = properties.get("SAM_LAST_DRIVE_FINGERPRINT");
properties.set("SAM_LAST_DRIVE_DISPATCH_MS", "0");
shouldFailDispatch = true;
assert.throws(() => bot.checkSamDriveChanges(), /HTTP 403/);
assert.equal(properties.get("SAM_LAST_DRIVE_FINGERPRINT"), previous, "failed dispatch must be retried");
shouldFailDispatch = false;
bot.checkSamDriveChanges();
assert.equal(sent.length, 4);
bot.uninstallSamDriveBot();
assert.equal(triggers.length, 0);

console.log("SAM Drive bot regression tests passed (scan, debounce, dispatch, retry, install/uninstall).");
