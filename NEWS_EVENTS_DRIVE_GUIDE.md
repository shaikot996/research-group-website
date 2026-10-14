# SAM News & Events — Google Drive editorial workflow

All routine content editing takes place in the existing shared [News and Events folder](https://drive.google.com/drive/folders/19frcFmQJsFFA3xU6TqiypUvEeuVZ2fi6), without editing GitHub files.

## Folder layout

- [News](https://drive.google.com/drive/folders/1R7-luTT96qRXcm1Nok0XyMyM6LroNCZv)/**One folder per news article**
- [Events](https://drive.google.com/drive/folders/1h8GMci0TK9OCN6UYXMNsFCJRFVCGc_S_)/**One folder per academic event**
- The same root also accepts an article/event folder directly if its Google Doc explicitly includes `TYPE: NEWS` or `TYPE: EVENT`.

Each individual story/event folder should contain one Google Doc (or DOCX/TXT) with the content, optional `cover.jpg` or `poster.png` and up to fifteen gallery photos. Do **not** put just a photo in an empty folder: a valid content document is required.

Copy the already-created [News template](https://docs.google.com/document/d/1M59Qem05fGMCY6pzt_KH8yPtXKKTmy9hRj5jTSGkiUs/edit) or [Events template](https://docs.google.com/document/d/1q534P155Gs6SrDstXwc3BL9_oKGMWQaiU_SB9t0AvVc/edit) into an individual article/event folder, then replace the bracketed example content.

## Fields

Field headings can be on separate lines, or entered as `TITLE: My headline`. Write `DATE` as `YYYY-MM-DD`, times as Bangladesh local `HH:MM` in 24-hour notation.

| Field | News | Event |
|---|---|---|
| TYPE | NEWS (needed for direct root folders) | EVENT (needed for direct root folders) |
| TITLE | Required | Required |
| SUMMARY | Required, under 650 characters | Required, under 650 characters |
| DATE | Required | Required |
| BODY / DESCRIPTION | Required | Optional |
| STATUS | DRAFT or PUBLISHED | DRAFT or PUBLISHED |
| CATEGORY | Optional | Optional |
| FEATURED | YES or NO | Optional |
| START TIME, END TIME | — | Optional, HH:MM |
| SPEAKER, AFFILIATION, VENUE | — | Optional |
| REGISTRATION URL | — | Optional |
| EXTERNAL URL | Optional source | Optional official page |

Only documents with `STATUS: PUBLISHED` become public. Missing mandatory data and empty folders stay unpublished. Images must be actual JPG, PNG or WebP files; they are checked before upload. Images and galleries appear on the article or event detail page.

## What updates automatically?

The GitHub-native Drive watcher scans all member folders **and** News and Events metadata approximately once per minute, including nested folders. On detected changes, it dispatches the existing deployment; the backup GitHub Actions schedule continues independently. Total time to public website includes GitHub runner startup, site build and Pages deploy. GitHub scheduled runs can be delayed.

- Edit document, image or gallery → updated in the next deployment.
- Change STATUS to DRAFT → no longer publicly visible.
- Delete the source folder → its Drive-generated news/event record is unpublished on the next complete sync.
- Curated news articles originally in GitHub/Prisma remain intact.

A folder by itself is not a public article. Check GitHub Actions `Sync Drive profiles and publish demo` for step `Sync News and Events from Google Drive` and its `[editorial]` log lines. The importer deliberately reports discovered/valid/skipped counts. Skip reasons include missing content document, missing TYPE on direct-root folder, missing DATE, missing SUMMARY, and DRAFT status.

## Design

The website uses the existing SAM navy/burgundy visual system: featured image stories, news cards, upcoming/past events, speaker and venue metadata, dedicated story/event pages, poster displays, calendar links and responsive image galleries. Photos uploaded to Drive are copied to the exported static website; visitors do **not** need Google Drive permissions.
