# SAM Research Radar — Daily automatic academic preprint digest

SAM Research Radar is a **separate** research-discovery section at `/research-radar`. This is deliberately not the group's authored News & Events feed, which remains Google Drive-managed and manually editorially approved.

## Daily automation

- The official arXiv query API is the primary metadata source, and arXiv's official Atom feed is the fallback.
- Four times daily at **07:17, 13:23, 19:29 and 01:35 Bangladesh time** (staggered best-effort GitHub Actions), `.github/workflows/research-radar.yml` runs `node scripts/refresh-research-radar.mjs`.
- Subjects: `hep-th`, `gr-qc`, `astro-ph.CO`, `hep-ph`, `math-ph`, `math.DG`, `math.OA`, `math.FA`, `math.QA`, `cs.LG`, `cs.AI`, `stat.ML`, `quant-ph` (13 feeds grouped into five visible subject themes).
- The script requests up to 75 recent entries per feed with at least 3 seconds between requests, normalizes their metadata, validates arXiv IDs, and stores `data/research-radar.json`.
- Records are deduplicated by canonical arXiv ID, retained for at most 45 days and capped at 110 topic-balanced articles. Algorithmic keyword and recency ranking determines the Paper of the Day and featured five papers. A diversified selection reserves slots for different research disciplines where available.
- On successful update, the automated job commits the verified snapshot and dispatches the existing static GitHub Pages deploy workflow. No personal access token, Google Doc update, commercial AI API, or human-triggered GitHub action is needed.
- If both arXiv sources fail for all feeds, the job fails visibly and keeps the previous verified snapshot. It does not publish fabricated news. A successful partial refresh retains previously verified records.
- arXiv updates may lag the requested run time. GitHub Actions scheduling and Pages deployments are best-effort, not immediate; a daily schedule does not guarantee fresh papers 365 days a year.

## Website

- `/research-radar` is a mobile-responsive editorial feed with gradient hero, animated orbital visual, Paper of the Day, diversified highlights, keyword search, five subject tabs, accessible load-more cards and original arXiv links.
- The homepage features the three top verified papers and the primary navigation exposes the Radar.
- Motion uses CSS only, with `prefers-reduced-motion` support. The interface works without animations.
- Every paper card labels its content **Preprint** and shows original authors, arXiv ID and direct source link. Text excerpts are from source abstracts; no AI-generated scientific claims are presented. The Paper of the Day selection is **algorithmic**, not an editorial endorsement or peer-review claim.
- The initial blank snapshot is displayed as "First collection pending" until the first verified arXiv refresh succeeds. Do not replace it with fictional papers to fill the design.

## Operations & testing

- CI runs `node scripts/test-research-radar.mjs` to validate Atom/RSS parsing, deduplication, date filtering and source URLs.
- New deployments validate `research-radar/index.html` and the smoke suite visits `/research-radar`.
- The scheduled feed workflow needs GitHub Actions permissions `contents:write` and `actions:write` (both scoped only to that job); it does not require a personal token.
- If the arXiv refresh is failing, inspect [Research Radar Actions](https://github.com/shaikot996/research-group-website/actions/workflows/research-radar.yml), and confirm daily refresh, verified arXiv response and latest Pages publish.
- To manually test *offline parsing*, run `node scripts/test-research-radar.mjs`. Avoid triggering live data collection repeatedly; arXiv API terms require appropriate request spacing.

**Attribution:** Thank you to arXiv for use of its open access interoperability. SAM Research Radar is independent and is not endorsed by arXiv.

## October 2026 relevance upgrade

The previous snapshot was 53/54 hep-th because tracked authors crowded out math and AI. The refreshed algorithm applies explicit topic gates to all authors, keeps a five-way subject quota before ranking, and indexes noncommutative geometry, operator algebras, spectral triples, gauge geometry, quantum information, AI for scientific mathematics/physics, string theory, compactification, moduli, flux cosmology, CFT, quantum gravity and inflation. The source-derived arXiv abstract stays unchanged. The website shows the collection timestamp in Bangladesh time; arXiv itself has no newly announced submissions on some weekends/holidays.
