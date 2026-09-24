# Release validation — 24 September 2026

Executed with Node.js 24.19.0 and npm 11.9.0 on Linux, using a production Next.js 15.5.16 build. The supplied GitHub Actions workflow runs the standard build and smoke checks with Node.js 22.

| Check | Result |
| --- | --- |
| Locked dependency installation (`npm ci`) | Passed |
| New SQLite database initialization and seed | Passed; 6 people, 6 research areas, 5 projects, 12 publications, 6 news items |
| Production compilation (`npm run build`) | Passed |
| TypeScript (`npm run typecheck`) | Passed |
| Project integrity and source imports | Passed: 40 required files, 34 page/route source files |
| Public HTTP routes discovered from sitemap | All 44 returned HTTP 200 |
| Shaikot profile, role, education and appointment | Corrected records displayed on public profile |
| Search and publication filters | Passed; invalid year parameter handled without server error |
| News/event empty state, contact email links, RSS, sitemap and robots | Passed |
| Public launch mode | Admin login and authentication API returned 404; no public admin link |
| Photo folder behavior | Initials → PNG added during runtime → initials after removal; no server restart |
| Portrait cards | Six images loaded correctly |
| Desktop and mobile browser checks | Passed at 1440×1000 and 390×844; screenshots inspected |
| Mobile navigation and theme controls | Passed; no horizontal overflow or browser runtime errors |
| INSPIRE section | Loads on expansion, with a usable external link/fallback if the API is unavailable |
| Optional admin authentication | Successful login and incorrect-password rejection verified |
| Editor sections | All nine content/settings sections opened successfully |
| Draft/published content | Created and edited through the editor; draft hidden, published page available |
| Runtime media upload | Uploaded PNG immediately served through its public URL |
| Repeat seed | Existing editor-created record retained |
| Shell launchers | Bash/sh syntax checks passed |
| Archive | Source only; no private database, passwords, installed dependencies or build output |

The Docker daemon and BRACU infrastructure are not available in this execution environment. Docker/Nginx/systemd configurations are supplied for IT, but the container build, university DNS, TLS and actual deployment have not been executed here. Windows was not used for runtime verification.

Automated HTTP verification is included as `npm run test:smoke`. It expects a running site in the default public launch configuration and the initial public dataset. The optional `--photos` check needs an empty local profile folder.
