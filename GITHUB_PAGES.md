# GitHub Pages V4

This repository is a server-backed Next.js + Prisma application. GitHub Pages cannot run its database/API/admin server, so the public demo is generated as a **validated static snapshot** from the real running app.

## Publish

From this folder, run exactly:

```bash
bash PUBLISH_GITHUB.sh
```

The script automatically:

1. installs dependencies and seeds/preserves the database;
2. builds the production Next.js app;
3. starts it only temporarily on localhost during export;
4. recursively discovers every public page and dynamic detail page;
5. exports portraits, CSS, fonts, uploads, RSS/calendar assets, and public files;
6. rewrites every internal URL for `/research-group-website/`;
7. creates both clean directory routes (`/people/`) and `.html` aliases (`/people.html`);
8. removes the Next.js client router from the static copy so links cannot jump to `https://shaikot996.github.io/people`;
9. validates internal links before any Pages push;
10. pushes the fixed source to `main` and the validated static output to `gh-pages`;
11. attempts to configure Pages to `gh-pages / (root)` automatically;
12. waits for the live deployment and verifies the Home, People, and Research routes before reporting success.

Live URL:

`https://shaikot996.github.io/research-group-website/`

The local temporary server is stopped automatically. The computer does **not** need to remain on after publishing.
