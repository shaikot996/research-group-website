# GitHub-native SAM Drive watcher

This is the zero-setup fast-sync path. It does **not** require Google Apps Script or a GitHub personal access token.

- **Workflow:** `.github/workflows/watch-drive.yml`
- **Watcher:** `scripts/watch-drive-changes.mjs`
- **Existing secret reused:** `GOOGLE_SERVICE_ACCOUNT_JSON` (already configured in this repository).
- **Authenticated GitHub dispatch:** short-lived built-in `GITHUB_TOKEN` with `actions:write` for the watcher job.
- **Watch areas:** Research Assistant, Principal Investigator and Co-Principal Investigator Drive roots, including nested files/folders.
- **Detection:** fetch a metadata fingerprint approximately once per minute, then request the existing `sync-drive.yml` build/deploy when data changes.
- **Duplicate protection:** successful change dispatches are coalesced for 150 seconds; a failed dispatch does not advance the recorded state and is retried.
- **Long-running runner renewal:** the job runs for approximately 4h10m before dispatching a fresh instance of itself (GitHub-hosted jobs have a 6h ceiling). A 4-hour schedule provides a recovery path if a runner stops unexpectedly. At each handoff, the site sync is triggered once to capture changes that may have occurred between runners.
- **Backup:** existing `sync-drive.yml` 5-minute schedule remains configured.

The GitHub Actions repository is public, so standard GitHub-hosted runner time is not charged as private-repository included minutes, subject to GitHub usage policy and runner availability. The watcher consumes a runner nearly continuously while enabled; for lower resource use, disable the `SAM Drive change watcher` workflow in Actions and rely on the five-minute backup, or deploy a persistent watcher on a university server.

**Caveats:** polling is approximately once per minute, not immediate push notifications; Apps Script and GitHub scheduling are both best-effort. A change becomes visible only after the downstream `sync-drive.yml` workflow completes static site regeneration and GitHub Pages deployment. New RA folders are automatically imported if they contain valid content; creating a brand-new PI/Co-PI still requires the separately fixed leader mapping. GitHub Actions runs may be delayed.

**Verify:** go to [SAM Drive change watcher](https://github.com/shaikot996/research-group-website/actions/workflows/watch-drive.yml). Look for a running job and logs such as `[watch] Initial baseline` and `[watch] Drive change detected ... deployment dispatched.` The subsequent `Sync Drive profiles and publish demo` run should appear as event `workflow_dispatch`.

The older Apps Script code `scripts/sam-drive-dispatch-bot.gs` is optional and need not be installed. Do not install both monitoring systems unless you specifically want redundant triggers. Never paste a personal access token in an issue, chat, repository file, or log.
