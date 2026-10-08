# SAM Research Group — GitHub Pages deployment

**Official domain:** https://sam.cse.bracu.ac.bd/

BRAC University manages the DNS CNAME for `sam.cse.bracu.ac.bd` pointing to
`shaikot996.github.io`. GitHub Pages custom domain must also be configured in
Repository → Settings → Pages, with **Source: GitHub Actions**.

## Production deployment

The `.github/workflows/sync-drive.yml` workflow deploys a **static snapshot** of
the running Next.js application to GitHub Pages at `/` (not at
`/research-group-website/`). It runs on pushes to `main`, on its existing
scheduled Google Drive sync, or by manual workflow dispatch. It still syncs
Google Drive research assistant profiles and refreshes INSPIRE data before
building the snapshot. The separate INSPIRE citation workflow is unchanged.

The exporter (`scripts/export-github-pages.mjs`):

1. Crawls public pages and assets from the production Next.js app.
2. Exports HTML routes and associated CSS, images, fonts, downloads, uploads, sitemap, robots and RSS feed.
3. Rewrites public URLs for the root of `sam.cse.bracu.ac.bd`.
4. Replaces Next.js client-side routing with the existing static interactions
   for search, theme switching, copy buttons and rotating homepage highlights.
5. Emits `.nojekyll` so GitHub Pages serves `_next` assets, and `CNAME` for the
   official custom domain.
6. Validates links before upload, including `scripts/verify-pages-export.mjs`.

Server-only features (Prisma, API routes, admin) continue to be supported in the
standalone Next.js deployment, not on GitHub Pages. No server-side/admin features
have been removed from source.

## Local verification (no push, no branch changes)

```bash
bash PUBLISH_GITHUB.sh
```

This prepares a local `_site/` artifact and validates it. To deploy, commit and
push changed files to `main`; the existing **GitHub Actions** workflow handles
publication. Do not change Pages source to `gh-pages` and do not force-push.

## HTTPS

After the DNS check passes, GitHub issues a certificate. Enable **Enforce HTTPS**
in Settings → Pages when the certificate is available. This certificate operation
is independent of the website's CSS/JS asset paths.
