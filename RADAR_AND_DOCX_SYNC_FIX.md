# SAM Research Radar and PI/Co-PI Drive sync — changes

## Research Radar

The production site uses a **static GitHub Pages export**, not a live Next.js server. Next.js client-side scripts are intentionally stripped from the export. Previously, React-powered subject buttons, search, and "Load more" appeared on the page but did not work.

The exporter now injects functional **vanilla JavaScript** controls into `static-demo.js` for [Research Radar](https://sam.cse.bracu.ac.bd/research-radar/): subject tabs, keyword search (paper/author/arXiv ID/abstract), result counts, reset and "Load more." The component exposes stable `data-radar-*` attributes; React interactivity remains functional in local Next.js development. Source abstracts can be expanded using native HTML `<details>`, which also works without any JavaScript.

The daily ingest now uses stricter physics/string theory keywords and watches **50 established string/QG researchers**, six verified coauthors in SAM-related work and two SAM investigators. The explicitly excluded author **Vladimir Rosenhaus** is not featured, even in a matched collaboration. Author query batches retrieve recent submitted papers independently of the five broad arXiv category feeds; a paper is only tagged as tracked if its full normalized author name actually matches. The public listing is capped at 54 papers, not the entire unfiltered recent arXiv firehose. These are algorithmically selected **preprints**, not peer-reviewed endorsements. The watchlist is editable in `data/radar-author-watchlist.json`; never infer collaborators merely from prominent-researcher outreach.

## PI/Co-PI folder import

The legacy leader importer accepted only **native Google Docs**. RA sync already accepted DOCX, creating inconsistent behavior. Now the PI and Co-PI importer accepts:
- a native Google Doc;
- a Word `.docx` file (using the same verified ZIP/XML text extractor as Research Assistants);
- plain TXT files.

The profile must have meaningful **NAME** and **ABOUT ME** headings. Both standalone headings and inline `NAME: Jane Doe`, `ABOUT ME: Research biography` are supported. Add JPG/PNG/WebP portrait and optional PDF CV in the same member folder. The relevant parent Drive folder is scanned automatically by the existing Drive watcher.

Existing curated PI/Co-PI profiles retain their stable IDs, achievements and grants. A folder named `Dummy`, `Sample`, `Template` or `Test` is **intentionally excluded**; `Dummy Sama` is not a valid new person folder. Duplicate names/identities are also excluded to avoid multiple pages for the same person. Use a real member's full name as the new folder name and their own profile document inside. If an edit appears missing, inspect `Sync Principal Investigators and Co-PIs from Google Docs` job logs: they record discovered, skipped, duplicate and synced counts.

## Navigation and readability

Desktop navigation has a compact two-tier header, fixed-width/no-wrap links and a clean white logo surface for dark-mode legibility. On smaller screens it retains a compact, usable mobile menu.

## Checks

- `scripts/test-content.ts`: DOCX leader selection + inline heading support.
- `scripts/test-research-radar.mjs`: strict subject matching, verified SAM coauthor, excluded author.
- `scripts/test-pages-export-fixture.mjs`: fails if the GitHub Pages static Radar JavaScript interactions are omitted.
- Existing CI checks, Next.js build/typecheck, root-domain Pages export and GitHub Pages deployment.
