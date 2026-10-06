# Release validation — 6 October 2026

This release was prepared from the uploaded source archive and updated for the **Strings, Artificial Intelligence and Mathematics (SAM)** site. Source-level and packaging checks were executed in the current Linux sandbox.

| Check | Result |
| --- | --- |
| Project structure | Passed: `node scripts/check-project.mjs` found all required files, 11 core Prisma models, 6 public members, 34 app routes and 75 source files |
| TypeScript/TSX parser pass | Passed: 68 TypeScript/TSX files parsed successfully with the installed TypeScript parser |
| JavaScript module syntax | Passed for all `scripts/*.mjs` via `node --check` |
| Shell syntax | Passed for launch/publish scripts via `bash -n` |
| JSON integrity | Passed for `package.json` and `package-lock.json` |
| Local image references | Passed: all referenced BRAC/member/JNI image assets exist inside `public/` |
| Publication/project references | Passed: all literal publication slugs referenced by projects resolve to publication seed records |
| Stale identity/temp-path scan | Passed: no old group name/acronym or temporary extraction/Desktop paths remain in the source tree |
| Supplied assets | Passed: official BRAC logo plus Mahbub, Ahmed, Tashnuba, Mishaal and JNI1–JNI3 assets are copied into project-owned paths |
| Production dependency installation | **Blocked by execution environment**: `npm ci` could not resolve `registry.npmjs.org` (`EAI_AGAIN`) |
| Production build | **Not executable in this sandbox** because dependencies are not present after the registry/DNS failure; `npm run setup` consequently stops at `prisma: not found` |
| Full runtime HTTP/browser smoke test | Not executable without the production dependency install/build |

The repository's existing GitHub Pages publication path remains `PUBLISH_GITHUB.sh` / `scripts/publish-github-pages.sh`. On a normal networked Linux machine it installs the locked dependencies, initializes the database, builds the production Next.js application, crawls the running public site into a repository-subpath-safe static snapshot, validates the exported links and publishes the snapshot to `gh-pages`.
