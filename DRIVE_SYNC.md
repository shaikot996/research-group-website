# Google Drive Research Assistant sync

The site uses a hybrid content model:

- GitHub/Prisma local content remains authoritative for PI, faculty, researchers and custom profiles.
- Google Drive is authoritative for `RESEARCH_ASSISTANT` profiles whose `contentSource` is `DRIVE`.
- A small `DRIVE_BOOTSTRAP` fallback keeps the initial Research Assistant section visible before the first successful Drive sync; the matching Drive folder is adopted in place rather than duplicated.

## Drive layout

The shared root folder is configured by `GOOGLE_DRIVE_ROOT_FOLDER_ID`. By default the sync script looks for a child folder whose name contains `Research Assistant`. If the RA folder has another name, set `GOOGLE_DRIVE_RA_FOLDER_ID` to its folder ID.

Every child folder of the RA folder is treated as one candidate person:

```text
Research Assistants/
  Walid Hasan/
    About Me            (Google Doc, preferred; .txt also supported)
    portrait.jpg        (jpg/png/webp)
    CV.pdf
  Another Person/
    ...
```

File names are flexible. The importer prefers names containing `about/profile/bio`, `portrait/profile/photo`, and `cv/resume`, then falls back to the first supported file of each type.

Use the repository template `templates/SAM-Research-Assistant-Profile-Template.docx` as the canonical profile document. Upload it directly to Google Drive or open/convert it with Google Docs, then make/copy one profile document for each person. **Keep the headings unchanged** and replace only the `[[...]]` placeholder text. Unused placeholders are ignored automatically, so optional sections can simply be left untouched. No Markdown/YAML/JSON is required.

The canonical headings are:

```text
NAME
CURRENT POSITION
AFFILIATION
EMAIL
PERSONAL WEBSITE
GOOGLE SCHOLAR
INSPIRE-HEP
ORCID
GITHUB
LINKEDIN
ABOUT ME
RESEARCH INTERESTS
CURRENT RESEARCH / PROJECTS
EDUCATION
RESEARCH EXPERIENCE
SKILLS / TOOLS
SELECTED ACHIEVEMENTS / AWARDS
SELECTED PUBLICATIONS / PREPRINTS
OTHER INFORMATION
```

Blank optional sections do not appear on the website. `TEMPLATE INSTRUCTIONS` is ignored by the parser, so the instruction block may remain in the Google Doc.

For an extra website section that is not in the standard template, add a heading line in this form:

```text
SECTION: Outreach and Service
Your text here.
```

The website will render it as its own **Outreach and Service** section. `CUSTOM SECTION: ...` works as well.

## Google access

The current Research Assistant folder is shared as **Anyone with the link**, so **no Google Cloud credential is required** for the default setup. The sync script can discover the public folder hierarchy, export public Google Docs as text, and download the public portrait/CV files directly.

Optional authentication is still supported if the folder is later made private or you want API-backed access:

- `GOOGLE_DRIVE_API_KEY` — optional Google Drive API key for public/API access.
- `GOOGLE_SERVICE_ACCOUNT_JSON` — optional service-account JSON; share the Drive root with its `client_email` as Viewer.
- `GOOGLE_DRIVE_RA_FOLDER_ID` — optional explicit RA-folder ID when auto-discovery is not desired.

Never commit credentials.

## Local commands

### Recommended local demo

```bash
./run-local.sh
```

`run-local.sh` now performs an **immediate Google Drive Research Assistant sync before the build** and, while the local server remains open, repeats the Drive sync every **10 minutes (600 seconds)**. Because the site reads people from the runtime database and Drive portraits/CVs from runtime asset routes, a successful background sync appears after a browser refresh; no rebuild is required for each Drive edit.

Disable the watcher but keep the startup sync:

```bash
LOCAL_DRIVE_SYNC_SECONDS=0 ./run-local.sh
```

For an immediate one-off refresh while the site is already running, open a second terminal in the project folder and run either:

```bash
./SYNC_DRIVE_NOW.sh
# or
npm run sync:drive
```

The sync command prints lines such as `[drive] Synced <name> -> /people/<slug>` when Drive content was imported.

`npm run sync:drive:optional` first uses the public-link mode when no API key/service account is configured. If Drive is temporarily unreachable, it exits successfully and keeps the current/bootstrap profiles visible. This is useful for CI/build environments and the public GitHub demo.

## Sync behavior

- New valid Drive person folder -> new RA profile after the next sync.
- Existing Drive folder changes -> existing profile updates by immutable Drive folder ID.
- Folder rename does not change an existing profile URL.
- Removed Drive folder -> corresponding Drive-managed profile becomes unpublished.
- A Drive folder can never overwrite a local/custom profile slug.
- Missing optional fields do not prevent a profile from rendering.
- Portraits are stored at runtime under `data/drive-people/`.
- CVs are stored under `data/uploads/` and served inline at `/uploads/<slug>-cv.pdf`.

The GitHub Actions workflow `.github/workflows/sync-drive.yml` checks Drive every 10 minutes and republishes the static GitHub Pages demo. GitHub schedules are best-effort, so a run may start later than the exact cron minute.

For the BRACU Node/Docker deployment, run `npm run sync:drive` from cron/systemd every 5–10 minutes using the same environment variables. The importer and parser are the same code used by GitHub Actions.

## INSPIRE citation snapshot

`config/inspire-authors.json` stores stable INSPIRE author control numbers for current verified group researchers. Ahmed Rakin Kamal is included as a current **Researcher**, so his verified INSPIRE record is included in the deduplicated group citation snapshot.

`scripts/sync-inspire.ts` resolves each stable INSPIRE author control number to its exact INSPIRE BAI and queries the official literature API with `a <BAI>`. It then deduplicates literature records by INSPIRE control number and sums each unique paper's `citation_count` once. A control-number `$ref` query remains only as a defensive fallback. Thus a paper coauthored by two configured group members is not double-counted.

The cache is `data/inspire-stats.json`. On refresh failure, a previous successful cache is retained. The 10-minute Drive/Pages workflow checks this cache before every build and refreshes it only when stale (24 hours by default), so the published GitHub Pages snapshot contains the current citation number. `.github/workflows/sync-inspire.yml` also performs a forced daily refresh and dispatches a Pages republish.

## DOCX profile support

A Research Assistant profile document may now be any of:

- a native Google Doc,
- a plain `.txt` file, or
- a Microsoft Word `.docx` file uploaded directly to Drive.

The sync extracts text from DOCX locally, so members do **not** need to convert the template to Google Docs first. If multiple profile documents are present, a SAM Research Assistant Profile DOCX / About / Profile / Bio file is preferred; when Drive metadata is available, newer files break ties.

For the least ambiguity, keep only one current profile document in each person's folder.

## Local live-update behavior

`run-local.sh` performs a Drive sync before the build and then repeats the Drive sync every `LOCAL_DRIVE_SYNC_SECONDS` (600 seconds / 10 minutes by default). The public homepage and People pages are rendered dynamically in the Node deployment, so after a background sync completes you only need to refresh the browser; restarting or rebuilding the local server is not required.
