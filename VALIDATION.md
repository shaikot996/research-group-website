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

## 2026-10-07 Drive/INSPIRE update validation

Completed in the artifact-generation sandbox:

- `node scripts/check-project.mjs` — passed.
- TypeScript parser/transpilation syntax checks for all newly changed TypeScript/TSX files — passed.
- Google Drive About Me parser tests (standalone headings, inline `HEADING: value`, bullets, education/other sections, plain-text fallback, stable slug) — passed.
- YAML parsing for both new GitHub Actions workflows and `docker-compose.yml` — passed.
- INSPIRE failure-path test with a seeded previous cache — passed: network failure preserved the previous citation count and exited successfully.
- Static assertions for Mishaal/Shaikot/Ahmed Researcher category, Ahmed published status with his existing profile retained, Tashnuba On Leave, Research Assistant bootstrap visibility, CV new-tab behavior, Drive source fields, scheduled sync intervals and SAM identity — passed.

The sandbox could not complete `npm ci` because outbound npm-registry/DNS access was unavailable. Therefore `npm run typecheck`, `npm run build`, and the live Next.js smoke test could not be executed here. The repository's GitHub `Build and verify` workflow now also runs the external-content parser regression test and will run the full install/typecheck/build/smoke sequence in GitHub Actions, where package-network access is available.

The Research Assistant section now has a Walid Hasan bootstrap profile in a clean install. A live Drive sync replaces/adopts that bootstrap row using Walid's actual Drive folder. The current public folder can be synced without credentials; API-key and service-account authentication remain supported as optional alternatives. The importer itself is folder-generic and future Research Assistant folders require no source-code change.

- Google Drive RA sync supports credential-free public-link mode for the currently public shared folder; authenticated API-key/service-account modes remain optional.

## 2026-10-07 citation deployment fix

- INSPIRE refresh now resolves stable author control numbers to exact INSPIRE BAI identifiers before literature search; the record `$ref` search is retained only as a fallback.
- GitHub Pages Drive sync now refreshes the citation cache before every build when the 24-hour cache is stale or missing.
- The standalone daily INSPIRE workflow now dispatches an immediate Pages republish after updating the cache.
- The local `PUBLISH_GITHUB.sh` path now attempts an INSPIRE refresh before building the static site.
- `scripts/publish-github-pages.sh` passes `bash -n` syntax validation.
- Both modified GitHub Actions workflow files parse successfully as YAML.
- `scripts/sync-inspire.ts` transpiles to JavaScript with only the expected missing-local-Node-type diagnostics in this dependency-free sandbox, and the emitted JavaScript passes `node --check`.

## V11 Drive/DOCX regression fixes

- Directly uploaded `.docx` Research Assistant profile documents are supported.
- DOCX text is extracted from `word/document.xml` without adding a runtime npm dependency.
- Template title/instruction chrome is excluded from member biography content.
- Homepage and People pages use dynamic rendering so local background Drive syncs appear after browser refresh without rebuilding.
