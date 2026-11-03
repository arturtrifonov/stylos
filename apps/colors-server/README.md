# Colors workspace API

Owner direction, 2026-10-23: keep Colors and JSON import public; allow only the
owner to save the Stylos instance, using the existing Pocket ID service.

The browser editor is independent of this optional Node 24 service. The hosted
instance uses `openid-client` Authorization Code with PKCE, state, nonce and JWS
signature verification. The Pocket ID client has a dedicated owner-only group;
the API independently allowlists the owner's stable subject identifier. No
Heuristica client or group is reused or modified. Client credentials stay in the
server's mode-0600 `.env`. They are absent from frontend bundles and the plugin.

Routes:

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /api/session` | public, no CORS | Current browser session or `user: null` |
| `GET /auth/login`, `GET /auth/callback` | public | Pocket ID code flow; only the allowed subject receives an editor session |
| `POST /auth/logout` | owner, origin + CSRF | End this Colors session |
| `GET /api/stylos` | owner | Saved working copy and revision |
| `PUT /api/stylos` | owner, origin + CSRF + If-Match | Validate and save a complete changes draft |
| `POST /api/stylos/publish` | owner, origin + CSRF + If-Match | Publish the saved revision |
| `GET /stylos-colors.figma.json` | public, anonymous CORS | Last published bundle, or the canonical initial palette |

Working and published records are separate. Ordinary visitors can use their
own local files and browser drafts; they cannot read the private working copy
or write server records. The browser can also explicitly open published colors.
Saving does not publish, and publication does not apply changes in Figma.
The existing plugin still performs anonymous reads and reviews before Apply.

Working drafts use the existing source-checked changes format. Server validation
shares the editor's palette shape and LCH/HEX projection checks. Limits are 1 MB
per draft, 5,000 palette paths and 10,000 changes/coordinates. `If-Match` rejects
stale saves/publication with 409; a user must reopen the working copy. The API
is one process owning its data directory. Writes use fsync and atomic rename;
each save/publication also leaves a revision in private `data/history/`.
Repository token files and the Figma library are not written by this service.

Sessions are opaque random identifiers in Secure/HttpOnly/SameSite=Lax host-only
cookies. Session records and single-use login transactions are held in memory,
bounded and expired after 8 hours / 10 minutes. Restarting signs users out but
preserves working and published records in the mounted data directory. The
logout ends Colors' session; it does not sign the user out of Heuristica or
Pocket ID. A fresh canonical source requires review of older stored drafts.

```sh
npm run colors:server:build
node tools/colors-server.test.mjs
```

The tests run the real OIDC library with a local in-memory signed identity
provider fixture, not a production login bypass. They check PKCE, signatures,
audience, nonce, replay, the owner allowlist, guest isolation, CSRF/origin,
revision conflicts, persistence and explicit publication. The live deployment
additionally verifies anonymous 401s and public 200s, group membership and the
owner subject, plus the real Pocket ID login redirect. Completing the live
passkey sign-in and exercising the authenticated UI requires the owner's device.

Deployment and recovery: [`deploy/colors`](../../deploy/colors/README.md).
