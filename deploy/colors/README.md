# Colors host

Deployed 2026-10-23 at [colors.arturtrifonov.com](https://colors.arturtrifonov.com)
on the owner's Hetzner server. The SSH profile is `hetzner`; application files
are in `/home/deploy/stylos-colors`, and its proxy route is
`/srv/caddy/sites/stylos-colors.caddy`. The direct public IP does not accept SSH
from this workspace; the existing `deploy@at-hetzner` profile does.

The owner's Hetzner host already runs Docker Compose and a shared Caddy proxy.
Colors joins its external `web` network as separate editor and API services.
JSON import and the editor remain public. The Node API saves the owner's
working copy after Pocket ID sign-in and publishes it only on a separate action.
Its route/session/storage contract is in
[`apps/colors-server`](../../apps/colors-server/README.md).

Build and package locally:

```sh
npm run colors:build
npm run colors:server:build
node tools/package-colors-host.mjs
```

Only `build/colors-host/` is uploaded to `/home/deploy/stylos-colors/`. The host builds
the serving images from prebuilt browser files and a bundled API. Node 24 is
provided by the API container; the host needs no Node installation or source
checkout. `.dockerignore` excludes runtime credentials, data and backups.

Initial owner-only Pocket ID provisioning is run on the server:

```sh
cd /home/deploy/stylos-colors
python3 connect-pocket-id.py --owner artur
mkdir -p data
chmod 700 data
```

The helper uses the existing local Pocket ID provisioning key without printing
it. It creates the separate `Stylos Colors` OIDC client and owner-only
`stylos-colors-editors` group, verifies restrictions, and writes credentials to
`.env` with mode 0600. Re-running preserves existing credentials and refuses
unexpected group members or client settings. It does not alter Heuristica.
The backend also allowlists the owner subject. Keep `.env` and `data/` private.

```sh
cd /home/deploy/stylos-colors
docker compose build
docker compose up -d --wait
```

The app listens on port 8080 inside the `web` Docker network. It publishes no
host port. Give `site.caddy.example` the chosen domain, then install it as
`/srv/caddy/sites/stylos-colors.caddy`. DNS must point to the host. Validate the
shared proxy configuration before reloading it:

```sh
docker exec caddy-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec caddy-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

The editor is at `/`. `/stylos.json` is its canonical snapshot;
`/stylos-colors.figma.json` is the public published transfer, routed to the API.
The API alone sets CORS and cache headers on that transfer. The static proxy's
CORS rule applies only to `/stylos.json`; duplicate Allow-Origin headers cause
browser/Figma fetches to fail even when the endpoint returns HTTP 200.
The private working copy is `/api/stylos`; its save and publish endpoints require
the owner session, same-origin CSRF header and matching revision. Figma reads
only the anonymous published endpoint. An initial deployment publishes canonical
colors by default; later deployments preserve stored publication and drafts.

Keep a private copy of the preceding host package before replacing files for an update.
Back up `data/` separately; it includes working/published JSON and private history.
Do not overwrite `.env` or `data/` when uploading a new build. The original static
host is archived in `backups/before-pocket-id-20261023.tar.gz` on the server.
To undo a deployment, restore that package and rebuild/recreate only the
Colors services. Do not remove its data directory. No existing app or shared
proxy restart is required. Session records are in memory; an API restart requires
signing in again.
