# Strings, Artificial Intelligence and Mathematics (SAM)

Research group website for BRAC University, built with Next.js, TypeScript, Prisma and SQLite. It runs on a university-managed Node.js server or Docker behind the university's HTTPS reverse proxy.

**Visitors never need an account. Administration is disabled by default.** There is no shared password or pre-created account. The source package contains no private database, secrets, installed dependencies or build cache.

## Start locally (Windows, Linux or macOS)

Install Node.js **22 or later**, then run inside this directory:

```sh
npm ci
npm run setup
npm run build
npm start
```

Open `http://localhost:3000`. `npm run setup` creates `.env` with a random secret and initializes the database. Running it again preserves existing content. For development, use `npm run dev` after setup.

On Linux/macOS, `bash run-local.sh` performs the same installation and build. An optional port can be supplied: `bash run-local.sh 6969`. For access from another computer on the local network: `HOSTNAME_BIND=0.0.0.0 bash run-local.sh 6969`.

## Give BRACU IT the repository

**Start with [DEPLOYMENT.md](DEPLOYMENT.md).** It contains the Docker and native Node deployment instructions, required persistent paths, reverse-proxy configuration, HTTPS settings and backup procedure. Hosting under a dedicated subdomain is supported. The repository is a Node application; a static-only `public_html` directory cannot execute it.

No hosting account or third-party database is required. Live publication enrichment optionally contacts INSPIRE when a visitor expands that section. The locally stored site and publication list work without it.

## Add profile pictures

Put a photo named **`profile.jpg`**, `profile.jpeg`, `profile.png` or `profile.webp` in that person's folder under `public/people/`. Refresh the page. No source edit, database change, rebuild or restart is needed for a running Node/Docker installation. Both the member list and profile page use the same photo.

| Person | Folder |
| --- | --- |
| Mahbubul Alam Majumdar | `public/people/mahbubul-alam-majumdar/` |
| Syed Hasibul Hassan Chowdhury | `public/people/syed-hasibul-hassan-chowdhury/` |
| Ahmed Rakin Kamal | `public/people/ahmed-rakin-kamal/` |
| Sayeda Tashnuba Jahan | `public/people/sayeda-tashnuba-jahan/` |
| Mishaal Hai | `public/people/mishaal-hai/` |
| Md Shaikot Jahan Shuvo | `public/people/md-shaikot-jahan-shuvo/` |

Example: `public/people/md-shaikot-jahan-shuvo/profile.jpg`.

Use a clear, centred headshot; square or portrait images of around 800 pixels are suitable. The cards crop to their frame. Missing photos show initials. Keep one supported profile file per folder; the lookup order is JPG, JPEG, PNG, WebP, with case-insensitive filenames. An explicit Photo path saved in the editor takes precedence; clear it to use the folder photo.

When photos are added to GitHub, BRACU IT must pull those files onto the running server. The standard Docker configuration mounts these folders from the host, so no image rebuild is needed.

## Edit content later

Initial content is in `prisma/seed.ts`; default group identity is in `lib/site-defaults.ts`. These files initialize a **new** database. Changing them does not overwrite an existing site's content.

For an existing site:

1. Set `ENABLE_ADMIN="true"` in `.env` and restart the service.
2. Create a personal administrator account:

   ```sh
   npm run admin:create -- --email YOUR_EMAIL --password YOUR_UNIQUE_PASSWORD --name "Site Administrator"
   ```

   Passwords must be at least 12 characters. For Docker, prefix the command with `docker compose exec web`.
3. Visit `/admin/login`. Edit people, education, appointments, publications, projects, research, news, events, pages and group settings.
4. Administration can remain enabled for editors, or be disabled again with `ENABLE_ADMIN="false"` and a restart. No public navigation link points to it.

Reset an existing account with `npm run admin:reset -- --email YOUR_EMAIL --password YOUR_NEW_PASSWORD`. Configuration uses server-side environment variables, so changing the administration flag does not require a rebuild.

The contact page links directly to principal investigators' existing email addresses. Set a group mailbox in Site Settings if one is assigned. This release does not present a web form that silently stores messages.

## Push to GitHub

Create an empty GitHub repository, then run:

```sh
git init
git add .
git commit -m "Prepare research group website for BRACU hosting"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

`.gitignore` excludes secrets, private databases, uploads and generated files. The six portrait folders and future profile images are included. A GitHub Actions workflow builds and checks the site on push and pull request. It does not deploy automatically.

## Validation

```sh
npm run check:project
npm run typecheck
npm run build
# With the site running in another terminal:
npm run test:smoke
```

For a local test database with empty portrait folders, `npm run test:smoke -- --photos` also verifies adding and removing a photo while the server stays running. See `VALIDATION.md` for checks performed on this release.

## Profile correction

Md Shaikot Jahan Shuvo is in the **Researcher** category while retaining his **Research Assistant, BRAC University, August 2026–present** appointment, with **MPhil in Physics, The Graduate Center, City University of New York (CUNY), 2026**. Ahmed Rakin Kamal is likewise a **Researcher** and his full existing profile, including the BRAC University Lecturer (On Leave) information, is retained.

## GitHub Pages demo

For the GitHub-hosted public demo, run `bash PUBLISH_GITHUB.sh`. This builds a validated static snapshot under the repository project path and publishes it to the `gh-pages` branch. See `GITHUB_PAGES.md` for details.

## Google Drive Research Assistant profiles

Research Assistants can now be maintained from Google Drive without editing GitHub. The PI/faculty/researcher custom pages remain local to this repository; Drive-managed profiles are isolated with `contentSource=DRIVE` and cannot overwrite a local profile. A bootstrap Walid Hasan RA row keeps the section visible before the first Drive sync and is automatically adopted/replaced by the real Drive folder.

See **[DRIVE_SYNC.md](DRIVE_SYNC.md)** for the folder convention, credential-free public-folder sync, optional authenticated access, local sync commands, GitHub Actions automation and production deployment behavior.

Useful commands:

```bash
npm run sync:drive            # sync public Drive directly; credentials are optional
npm run sync:drive:optional   # same sync, but preserves current data if Drive is temporarily unavailable

Research Assistant editors should use `templates/SAM-Research-Assistant-Profile-Template.docx`, upload it directly as DOCX or open it as a Google Doc, and edit only the placeholder values. The Drive parser understands the template headings and optional `SECTION: Custom title` sections.
npm run sync:inspire          # refreshes only if the 24h cache is stale
npm run sync:inspire:force    # force an INSPIRE refresh
```

The GitHub Pages demo is republished from Drive on a scheduled workflow. Before every Pages build it also checks the INSPIRE group-citation cache and refreshes it when the 24-hour cache has expired (or when no citation cache exists yet). Docker deployments use the same cached refresh logic in the `content-sync` service.

## Local Drive-synced demo

Run:

```bash
./run-local.sh
```

The launcher now syncs Google Drive Research Assistants before building and continues polling Drive every 10 minutes while the local site is running. To force an immediate refresh in another terminal, run `./SYNC_DRIVE_NOW.sh`. See `DRIVE_SYNC.md` for access and troubleshooting details.

### Research Assistant Drive profile files
Drive-managed RA profiles accept native Google Docs, `.txt`, and uploaded `.docx` documents. The provided SAM profile template can therefore be filled in Word/LibreOffice and uploaded directly without conversion.
