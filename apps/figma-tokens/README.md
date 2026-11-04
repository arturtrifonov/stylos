# Stylos Tokens — Figma plugin

A first color-token transfer plugin for the owner's Figma account. It updates
local variables in place after an explicit destination mapping and a review.
Its source is self-contained: `code.ts` is the Plugin API entrypoint, `ui.html`
contains the form panel, styled with Figma theme tokens. The form uses native
HTML controls; fig-content and fig-footer remain its outer panel containers.
It is not a generic DTCG importer or a Community release.

[Try Stylos Tokens in a new Design file](https://www.figma.com/file/new?try-tool-resource-content-id=314b1bc6-3c77-43ae-adee-0fa63868958a&try-tool-resource-type=gen_tool&type=design&mode=design)

Resource id: `314b1bc6-3c77-43ae-adee-0fa63868958a`.
Deployed version: `188e137702b579cb9a832c4b6ffabb214f8d0fb9`.
The account-library deployment accepts complete replacements of these two files;
it supplies the manifest. The native form does not require a custom-element
component runtime. Conventional development-plugin registration remains separate.

## Transfer

1. Open the plugin in the intended Design file. It loads published colors from
   [Colors](https://colors.arturtrifonov.com/stylos-colors.figma.json) and compares
   them with the file automatically. **Refresh** fetches the published source
   again; **Check again** rechecks the loaded source against current variables.
   Both invalidate an old Apply plan. Neither writes to the file.
2. The main result states whether changes are pending, everything matches, or
   conflicts need a decision. Counters distinguish **new variables**, **value
   updates** and **unchanged values**. A separate count identifies role values
   that follow a changed palette through an unchanged alias; these are not
   reported as unchanged colors. New variables are deduplicated across modes,
   while value counts and rows describe individual mode values.
3. **Inspect differences** shows the token, collection, theme, operation and
   before/after values with color samples. Filters separate direct changes,
   roles following the palette and unchanged definitions. Rows are paginated.
   **Collections & options** is collapsed by default. Exact-name defaults follow
   `palette.light` / `palette.light`, `palette.dark` / `palette.dark`, and `color`
   / `color.light` + `color.dark`. Ambiguous destinations still need an explicit
   choice; new collections/modes are disclosed before any creation. Independent
   Figma edits and changed role bindings block Apply until their explicit conflict
   options are enabled and the file is checked again.
4. **Add to Figma / Apply changes** writes only the reviewed plan. A stale file
   is rejected before writing. Success retains the exact applied before/after
   report and counts, with a reminder about Figma Undo. A no-change result says
   that nothing was written and has no Apply button. Existing variable IDs,
   unrelated tokens and canvas layers are preserved; new role variables receive
   appropriate fill/stroke/effect scopes. Existing metadata remains intact.
5. **Use a local JSON file** accepts an unpublished complete transfer exported
   with **Export for Figma… → Advanced → Download plugin transfer**. Native DTCG
   mode files go to Figma Variables → Import mode instead. File and paste inputs remain available if the public
   server cannot be reached. Browser draft JSON is a different format. Only the
   owner's **Save working copy → Publish colors** updates the public source.
6. **Export palette** lives in **Collections & options**. It reads existing
   palette collections into a source-checked draft. Use **Download draft**, then
   **Open JSON** in Colors. Figma returns opaque HEX values; graph coordinates
   are omitted to avoid restoring stale LCH metadata. Semantic bindings are not
   edited by the return file.

Semantic colors use real variable aliases. Shadows use composed color values
with the binding and a separate opacity percentage, as documented in
[Figma's variables guide](https://developers.figma.com/docs/plugins/working-with-variables/).
The adapter uses the current public API even when the account-library compiler's
older typings omit composed colors. An unsupported runtime fails and rolls
back; it does not flatten the alias to a literal color.

The apply action creates an undo boundary. On an API failure it restores touched
existing values and removes only variables, modes and collections created by
that attempt. An incomplete rollback is reported explicitly. Figma's normal Undo
can revert a completed import. The panel makes an anonymous HTTPS GET to the
fixed Colors endpoint with credentials omitted, no redirects and a 12-second
timeout. It sends no document contents. No access token or account credentials
are embedded in plugin source.

Canonical repository files still come from the normal Figma export and
`npm run tokens:import`. This plugin does not publish the library or write the
repository. Other token types, generic file formats, component bindings and
library publication are outside this first slice.

## Verification

```sh
npm run figma:tokens:check
node tools/preview-figma-tokens.mjs  # http://127.0.0.1:4176/; simulated Figma API
node tools/figma-tokens.test.mjs
npm test
```

The tests execute the actual entrypoint core against a simulated Plugin API:
initial/repeated imports, ID preservation, opaque palette round-trips, semantic
aliases and shadow opacity, destination/type conflicts, stale previews, mode
limits and rollback of both created and existing data.

A read-only run of this same planner against **Stylos / Styles** on 2026-10-23
found 176 new special variables, 44 dark-theme special text/border binding
conflicts and 818 unchanged values. The existing palette values matched the
source. No variables or canvas nodes were mutated. This agrees with the
previously recorded special-scale divergence in
[`figma/foundations.md`](../../figma/foundations.md).
**Panel repair, 2026-10-23.** The original panel relied on PropsKit control
values and unprotected startup metadata. The replacement isolates its script,
uses native buttons, a real file input, textarea/select/checkbox controls and
message event listeners. It registers the sandbox handler before opening the
UI, tolerates unavailable relaunch metadata, correlates requests and responses,
and shows startup/response failures instead of silently becoming unusable.
The initial window is 420 px high and grows for mapping/review up to 720 px;
large JSON input is collapsed after loading.

The complete panel and actual entrypoint were exercised in the browser harness:
file picker and paste loading, preview, pagination, Apply, an unchanged repeat,
and palette export to a download link. Only the variable API is simulated;
these checks do not change a real document. Entrypoint regression tests also
cover iframe startup, missing relaunch support, request correlation, failure
recovery and the full load/review/apply/export message sequence. The updated
account-library build passed. The owner confirmed the repaired panel works.
Figma Undo still needs manual confirmation.

**Direct loading, 2026-10-23.** The browser harness fetched the real public HTTPS
endpoint automatically, verified the version/fingerprint and loaded 288 palette
tokens and 319 roles. Reload removed a previous Apply plan; Review/Apply and an
unchanged repeat completed using the simulated variable API. Direct loading
inside the actual Figma host still needs manual confirmation; the available
browser session required Figma sign-in. The owner-hosted editor itself was
opened and inspected in the browser over HTTPS.

**CORS repair, 2026-10-24.** After adding the API, both it and the static proxy
set Allow-Origin on the published bundle. The duplicate headers reproduced
the owner's `Failed to fetch` in the actual panel harness despite HTTP 200.
The proxy now leaves transfer CORS/cache headers to the API. Reload in the same
panel fetched all 288 palette tokens and 319 roles from the live endpoint.
This is a host configuration fix; the deployed plugin source/version is unchanged.

**Sync panel redesign, 2026-10-24.** The default view is the automatic comparison,
not an expanded three-step importer. Explicitly scoped native-control styles
keep panel geometry independent of host CSS. Tests cover alias-following impact,
distinct variable/mode-value counts and retention of the applied report. The
browser harness checks initial creation, success, unchanged repeat, one palette
update with five dependent roles, conflict blocking and local JSON fallback.
Only the variable API is simulated; the published source is fetched over HTTPS.

**Native export split, 2026-10-29.** Local-import guidance now directs native
DTCG JSON to Figma Variables → Import mode, and unpublished plugin transfers to
Colors → Export for Figma → Advanced → Download plugin transfer. The published
endpoint and its `stylos-figma-colors` protocol remain compatible. Native export
separates Special files; the plugin's existing destination mapping and any
existing Figma variables are not migrated by that download.
