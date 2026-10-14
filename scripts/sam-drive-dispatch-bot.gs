/**
 * SAM Research Group: Drive change -> GitHub Actions dispatcher.
 *
 * Paste this file into the Google Apps Script project that already monitors
 * SAM Drive folders (or a new standalone Apps Script project).
 *
 * Script property required:
 *   SAM_GITHUB_TOKEN = GitHub fine-grained token scoped to
 *   shaikot996/research-group-website with Actions: Read and write.
 *
 * Run installSamDriveBot() ONCE. It creates a one-minute clock trigger.
 * The five-minute GitHub Actions schedule remains a separate safety net.
 *
 * No private file contents are transmitted to GitHub. Only a dispatch
 * signal is sent after a folder's metadata fingerprint changes.
 */

var SAM_DRIVE_BOT_CONFIG = {
  owner: "shaikot996",
  repo: "research-group-website",
  workflow: "sync-drive.yml",
  roots: [
    { name: "Research Assistants", id: "10_rzMMevZi6_T-bajAnmaynab0UbDBtv" },
    { name: "Principal Investigators", id: "19uuYERTNBIaET6MlehwjF6kvS1L7sLlc" },
    { name: "Co-Principal Investigators", id: "1BePrxyFvH-xlqAMZVuEbgtn8qV9a1GjM" }
  ],
  cooldownMilliseconds: 90000,
  maxNodes: 3000
};

function samBotToken_() {
  var token = (PropertiesService.getScriptProperties().getProperty("SAM_GITHUB_TOKEN") || "").trim();
  if (!token) {
    throw new Error("Set Script property SAM_GITHUB_TOKEN (GitHub Actions read/write token) before installation.");
  }
  return token;
}

function samDriveDate_(value) {
  return value && typeof value.getTime === "function" ? String(value.getTime()) : "unknown";
}

function samDriveFingerprint_() {
  var records = [];
  var seenFolders = {};
  var config = SAM_DRIVE_BOT_CONFIG;

  function walk(folder, path, depth) {
    if (depth > 8) throw new Error("Unexpected folder depth >8 at " + path);
    var id = folder.getId();
    if (seenFolders[id]) return;
    seenFolders[id] = true;
    records.push("D|" + path + "|" + id + "|" + samDriveDate_(folder.getLastUpdated()));

    var files = folder.getFiles();
    while (files.hasNext()) {
      var item = files.next();
      records.push(
        "F|" + path + "/" + item.getName() + "|" + item.getId() + "|" +
        samDriveDate_(item.getLastUpdated()) + "|" + String(item.getSize())
      );
      if (records.length > config.maxNodes) throw new Error("Drive bot scan limit exceeded");
    }

    var folders = folder.getFolders();
    while (folders.hasNext()) {
      var child = folders.next();
      walk(child, path + "/" + child.getName(), depth + 1);
      if (records.length > config.maxNodes) throw new Error("Drive bot scan limit exceeded");
    }
  }

  config.roots.forEach(function (root) {
    walk(DriveApp.getFolderById(root.id), root.name, 0);
  });

  records.sort();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, records.join("\n"));
  var fingerprint = digest.map(function (b) {
    return ("0" + ((b + 256) % 256).toString(16)).slice(-2);
  }).join("");
  return { fingerprint: fingerprint, fileCount: records.length };
}

function samDispatchWorkflow_() {
  var c = SAM_DRIVE_BOT_CONFIG;
  var url = "https://api.github.com/repos/" + c.owner + "/" + c.repo +
    "/actions/workflows/" + c.workflow + "/dispatches";
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + samBotToken_(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    payload: JSON.stringify({ ref: "main", inputs: { source: "drive-bot" } }),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  if (status !== 204) {
    // Avoid leaking the token, headers or raw GitHub errors into audit logs.
    throw new Error("GitHub workflow dispatch failed (HTTP " + status +
      "). Verify SAM_GITHUB_TOKEN Actions: Read and write permission.");
  }
  Logger.log("SAM Drive bot: GitHub workflow dispatched.");
}

/**
 * Run once interactively after setting SAM_GITHUB_TOKEN in Script Properties.
 * Keeps existing Drive audit triggers intact.
 */
function installSamDriveBot() {
  samBotToken_();
  var snapshot = samDriveFingerprint_();
  // Verify GitHub permissions first. Do not install a failing trigger.
  samDispatchWorkflow_();

  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    SAM_LAST_DRIVE_FINGERPRINT: snapshot.fingerprint,
    SAM_LAST_DRIVE_DISPATCH_MS: String(Date.now())
  }, false);

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "checkSamDriveChanges") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("checkSamDriveChanges").timeBased().everyMinutes(1).create();
  Logger.log("SAM Drive bot installed (1-minute check, initial GitHub sync sent). " +
    snapshot.fileCount + " Drive nodes monitored.");
}

/**
 * Installed one-minute trigger. Unchanged Drive snapshot = no GitHub run.
 * Retry automatically on the next minute if the dispatch fails.
 */
function checkSamDriveChanges() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    Logger.log("SAM Drive bot: another scan is running; skipping overlap.");
    return;
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var current = samDriveFingerprint_();
    var previous = props.getProperty("SAM_LAST_DRIVE_FINGERPRINT");
    if (current.fingerprint === previous) {
      Logger.log("SAM Drive bot: no change in " + current.fileCount + " nodes.");
      return;
    }
    var lastSent = Number(props.getProperty("SAM_LAST_DRIVE_DISPATCH_MS") || 0);
    if (Date.now() - lastSent < SAM_DRIVE_BOT_CONFIG.cooldownMilliseconds) {
      Logger.log("SAM Drive bot: change detected; waiting for debounce window.");
      return;
    }
    // Store the fingerprint only after GitHub confirms accepting the dispatch.
    samDispatchWorkflow_();
    props.setProperties({
      SAM_LAST_DRIVE_FINGERPRINT: current.fingerprint,
      SAM_LAST_DRIVE_DISPATCH_MS: String(Date.now())
    }, false);
    Logger.log("SAM Drive bot: change detected, deployment requested (" +
      current.fileCount + " nodes).");
  } finally {
    lock.releaseLock();
  }
}

/** Optional connectivity test: dispatches one full GitHub sync immediately. */
function testSamDriveBot() {
  samDispatchWorkflow_();
  Logger.log("GitHub Actions dispatcher is working.");
}

/** Stops this bot without disabling any existing Drive audit monitors. */
function uninstallSamDriveBot() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "checkSamDriveChanges") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log("SAM Drive bot trigger removed. GitHub's backup schedule is unchanged.");
}
