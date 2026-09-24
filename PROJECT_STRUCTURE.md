# Project structure

| Path | Responsibility |
| --- | --- |
| `app/` | Public pages and optional administration routes |
| `components/` | Navigation, portraits, content cards, editor controls |
| `prisma/schema.prisma` | Normalized people, education, appointments, publications, projects and relationships |
| `prisma/seed.ts` | Initial public content for an empty database; transactional and repeat-safe |
| `lib/site-defaults.ts` | Initial group identity and fallback site settings |
| `data/member-sources.json` | Source provenance and owner-confirmed profile corrections |
| `public/people/<slug>/` | Drop-in profile photos; one `profile.jpg`, `.jpeg`, `.png` or `.webp` per member |
| `app/portraits/[slug]/route.ts` | Runtime photo lookup and initials fallback |
| `data/site.db` | Local runtime database, excluded from Git |
| `data/uploads/` | Uploaded images/PDFs, excluded from Git |
| `app/uploads/[filename]/route.ts` | Runtime delivery of editor uploads |
| `lib/features.ts` | Server-side administration switch |
| `lib/admin.ts` | Session, current-user and role checks for administrative actions |
| `lib/inspire.ts` | Timeout-limited INSPIRE fetch and data normalization |
| `components/inspire-publications.tsx` | Fetches optional publication feed only when expanded |
| `scripts/setup.mjs` | Cross-platform environment and database initialization |
| `scripts/serve.mjs` | Standalone production server launcher |
| `scripts/smoke.mjs` | HTTP checks against the running application |
| `deploy/` | University reverse proxy and service examples |
| `.github/workflows/check.yml` | Build and runtime smoke checks |

The role, title and institution displayed in member listings all come from `Person`. Academic qualifications and job history are related `Education` and `AcademicPosition` records. Portraits are resolved from the person's stable slug unless the optional editor supplies an explicit Photo URL.

The public contact page uses email links, and announcements only show stored news and actual added events. Administration can be enabled later without changing the public page architecture.
