# SAM Drive Change Bot — optional Google Apps Script setup

**Update:** The website now has a GitHub-native Drive watcher that starts automatically without Google Apps Script or a personal access token. See [GITHUB_DRIVE_WATCHER.md](GITHUB_DRIVE_WATCHER.md). This older Apps Script bot is **optional**; do not install it unless you specifically need an alternative monitoring service.

**Purpose:** Trigger the existing \`Sync Drive profiles and publish demo\` GitHub Actions workflow after a Google Drive change, without giving the RA/PI/Co-PI editors GitHub accounts.

The project is hosted by **GitHub Pages**, so Google Drive edits cannot directly change the already-generated static HTML. The bot detects changes within approximately one minute, triggers the existing GitHub Actions build, and publishes once the build/export/deploy finishes. This is **near-real-time**; it is **not instantaneous live rendering**.

## What has been configured in the repository

- The existing \`.github/workflows/sync-drive.yml\` accepts authenticated external \`workflow_dispatch\` calls with input \`source: drive-bot\`.
- The bot source is [\`scripts/sam-drive-dispatch-bot.gs\`](scripts/sam-drive-dispatch-bot.gs).
- The current GitHub Actions five-minute schedule stays enabled as a **backup** until the bot is installed and confirmed.
- The bot watches **Research Assistant Profiles**, **Principal Investigators** and **Co-Principal Investigators**, recursively. It tracks additions, removals, renames, moves, and file modification timestamps. Google Docs profile bodies and portraits/CVs are not sent to GitHub by the bot; GitHub Actions already reads them using the existing Google service account.
- No duplicate build for an unchanged snapshot; a 90-second debounce handles clusters of edits.

## One-time setup requiring the Google account owner

The ChatGPT Google Drive connector can edit/read Drive files but cannot configure Google Apps Script triggers or Script Properties; the following is an account-level authorization, not a repo-code change.

1. Create a **fine-grained personal access token** at https://github.com/settings/personal-access-tokens/new . Choose:
   - Resource owner: your GitHub account.
   - Repository access: **Only select repositories** -> \`shaikot996/research-group-website\`.
   - Repository permissions: **Actions -> Read and write**. Other privileges can stay minimal.
   - Choose an expiry that suits you; if the token expires, rotate it in Script Properties.
   - **Never send the token in chat, upload it to Drive, or commit it to GitHub.**
2. Open the **existing SAM Drive audit Apps Script project** (the one with your 2-minute monitor). Alternatively use https://script.google.com/home/projects/create . In its editor, add a script file named \`SAM_Drive_Bot.gs\` and paste the contents of [\`scripts/sam-drive-dispatch-bot.gs\`](scripts/sam-drive-dispatch-bot.gs).
3. Open **Project Settings (gear) -> Script Properties -> Add script property**. Name \`SAM_GITHUB_TOKEN\`; value is the fine-grained token created in step 1.
4. From the function selector, run \`installSamDriveBot\` **once**, approving the requested Google permissions. This validates GitHub dispatch before installing the trigger and immediately starts an initial website rebuild.
5. Check **Executions** and GitHub Actions: https://github.com/shaikot996/research-group-website/actions/workflows/sync-drive.yml . The initial run should have the \`workflow_dispatch\` event. Future Drive changes will enqueue another run, after the approximately one-minute scan.

**The installer does not delete or replace the existing Apps Script Drive audit trigger.** Re-running it safely replaces only its own \`checkSamDriveChanges\` trigger, so it will not accumulate duplicates.

## How to verify

- Create a valid new RA subfolder, with profile Google Doc (or DOCX/TXT), portrait and CV if available. Edits to any of these items trigger the watcher; the site will show the new profile after successful Actions deployment.
- Modify an existing PI/Co-PI document or photo; that profile updates after the next deployment. Creating *brand-new* PI/Co-PI profiles still requires extending the fixed leader mapping in \`scripts/sync-leaders.ts\`.
- See recent bot executions in Apps Script under **Executions**.
- Test GitHub permissions without changing Drive data by running \`testSamDriveBot\` once in Apps Script; this intentionally queues one sync.
- To stop near-real-time dispatch: run \`uninstallSamDriveBot\`; GitHub five-minute polling remains.
- A failed GitHub dispatch does not advance the fingerprint, so the next one-minute trigger retries. Existing GitHub workflow validation preserves the previously published site if Drive discovery fails.

## Limitations

Google Drive has no installable generic \`onEdit\` trigger for arbitrary nested folders; the script uses time-driven polling at Google's one-minute minimum. Apps Script trigger invocation is best-effort and GitHub Actions jobs need time to build/export/deploy. There is no seconds-level publication guarantee. If the token expires, loses access, or Google Apps Script authorization is revoked, the GitHub five-minute backup still works.

The bot uses an Apps Script **Script Property** for its GitHub token, not source code, and only needs the repository-scoped Actions write permission. Do not share the Apps Script project with external editors who should not have access to this token.
