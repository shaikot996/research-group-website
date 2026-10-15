# Research Snapshot: citation and publication sources

- The group totals in `data/inspire-stats.json` are INSPIRE-only. Shared INSPIRE publication records are deduplicated by INSPIRE literature identifier.
- `data/researchgate-stats.json` stores an independently verified ResearchGate profile snapshot for disciplines not comprehensively indexed by INSPIRE.
- The homepage and Research page display the ResearchGate values next to, **not added to**, the INSPIRE group totals. Citation databases overlap and use different indexing/record-version policies; an arithmetic sum would not be a defensible citation count.
- The individual profile page reads the same ResearchGate snapshot, so it stays consistent with the group panel.
- ResearchGate has no reliable unauthenticated public citation-count API. These values are updated by verification, not inferred from reads, other authors' profiles, or a bot's unverified scrape. Update the JSON only after checking the exact profile (ideally a fresh signed-in screenshot) and adjust `verifiedAt`.
- Last publicly verifiable value on 2026-10-16 for https://www.researchgate.net/profile/S-Chowdhury-2 : **29 publications, 119 citations**. A claimed newer **30 publications / 300+ citations** has not yet been independently verified and is not published.
