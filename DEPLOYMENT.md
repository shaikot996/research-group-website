# BRACU IT deployment handover

## Application requirements

| Item | Requirement |
| --- | --- |
| Hosting | Dedicated university subdomain pointing to this service |
| Runtime | Node.js 22+ and npm, or Docker Engine with Compose |
| Database | Local SQLite file; no separate database service |
| Public entry point | University HTTPS reverse proxy to `127.0.0.1:3000` |
| Storage | Persistent database and uploads; profile photo folders |
| External requests | npm during installation; optional INSPIRE HTTPS API at runtime |
| Visitor login | None |
| Administrative login | Disabled by default; optional content editor |

This is a server application. A PHP-only or static-file hosting account needs a Node service or Docker support from IT. Keep one application instance with its local SQLite volume; do not spread that file across independent servers.

## Recommended: Docker Compose

1. Clone the repository on the server and enter its directory.
2. Copy `.env.example` to `.env`. Set the **actual assigned HTTPS subdomain**, without a trailing slash, in both `SITE_URL` and `NEXTAUTH_URL`. Keep `ENABLE_ADMIN="false"` for the public launch.
3. Replace `GENERATE_ON_SETUP` with a random value. With Node installed, generate one using:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Alternatively use `openssl rand -hex 48`. Copy the result into `NEXTAUTH_SECRET`; keep `.env` local to the server.
4. Start the application:

   ```sh
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail=50 web
   curl --fail http://127.0.0.1:3000/api/health
   ```

   The entrypoint initializes the schema and initial content. Existing content is preserved on restart. No administrator is created automatically.
5. Configure the university proxy using `deploy/nginx.conf.example`, replacing `GROUP_SUBDOMAIN` and certificate paths. Create the DNS record, apply the university TLS certificate and reload Nginx after `nginx -t` passes.
6. Verify `/`, `/people`, `/people/md-shaikot-jahan-shuvo`, `/publications`, `/contact`, `/sitemap.xml` and `/api/health` through HTTPS. `/admin/login` returns 404 while administration is disabled.

The Docker service only publishes port 3000 on loopback. The proxy supplies the original host and protocol. All application paths are relative to the origin; the deployment is intended for the subdomain root.

### Docker persistence

- `research_group_data` named volume: `/app/data/site.db` and `/app/data/uploads/`.
- `./public/people` host directory: mounted read-only at `/app/public/people`.
- Do not use `docker compose down -v` during routine updates, because it deletes the database volume.
- Add photos to `public/people/<person-slug>/profile.jpg` on the **host**. The app reads them on each request; refresh the browser to see changes.

## Alternative: native Node with systemd

1. Install Node.js 22+ and npm. Clone to `/srv/research-group-website` and give a dedicated `researchgroup` service account ownership.
2. As that account, run `npm ci` and `npm run setup`.
3. Edit `.env` with the real `SITE_URL`, matching `NEXTAUTH_URL`, `BIND_HOST="127.0.0.1"` and `PORT="3000"`.
4. Run `npm run build` and `npm start` once to check the site. Stop that foreground process.
5. Install `deploy/research-group.service` in `/etc/systemd/system/`, adjusting the Node executable path if required, then run:

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable --now research-group
   sudo systemctl status research-group
   ```

6. Configure DNS, HTTPS and Nginx as in the Docker path.

`npm start` launches the compiled standalone server and supplies absolute runtime database/media paths. It copies static build assets to the standalone directory before starting. The service account needs write access to `.next`, `data`, and its uploaded media directory. Photographs remain in the repository's `public/people` folders.

## Updates and editing

For a source update, pull the repository, rebuild and restart:

- Docker: `git pull` followed by `docker compose up -d --build`.
- Native Node: `git pull`, `npm ci`, `npm run build`, then restart the systemd service.

Photographs alone need only a file copy or `git pull`, followed by a browser refresh. Database content changes are made through the optional editor; seed data only initializes an empty site. This source package is intended for a fresh installation and does not import the old local SQLite database or its accounts.

To enable the editor, set `ENABLE_ADMIN="true"`, restart, and create an account using the command in README. Contact links use member addresses already stored in the content. No SMTP service is required.

## Backup and restore

Preserve **all three**: the SQLite database, uploaded files, and portrait folders. Keep `.env` separately with the server configuration.

For a consistent Docker backup, briefly stop writes:

```sh
mkdir -p backups
docker compose stop web
docker compose cp web:/app/data ./backups/data
cp -a public/people ./backups/people
docker compose start web
```

Use a new backup directory for each backup. For native Node, stop the systemd service, copy `data/` and `public/people/` to a new backup directory, then restart. To restore, stop the service, restore all three locations with ownership readable/writable by the application user (UID/GID 1001 in Docker for `data/`), then start and check `/api/health`.

## Configuration reference

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma SQLite URL; local default `file:../data/site.db` |
| `SITE_URL` | Public HTTPS origin used by metadata, sitemap and RSS |
| `NEXTAUTH_URL` | Same public origin when administrative login is enabled |
| `NEXTAUTH_SECRET` | Random session secret generated at setup |
| `ENABLE_ADMIN` | Exact value `true` enables admin pages and authentication API |
| `UPLOAD_DIR` | Writable uploaded-media directory; default `data/uploads` |
| `PEOPLE_PHOTO_DIR` | Per-person photo root; default `public/people` |
| `BIND_HOST` | Native launch address; default `127.0.0.1` |
| `PORT` | Native launch port; default `3000` |

Implementation follows the [Next.js self-hosting guide](https://nextjs.org/docs/15/app/guides/self-hosting) and [Docker's Next.js guide](https://docs.docker.com/guides/nextjs/).
