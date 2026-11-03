# Stylos Colors

An owner-facing editor for the base Stylos colour tokens. It is an independent
React application; the documentation site can carry its static build at
`colors/`, but hosting it with the site is optional. Local editing and file
exchange need no account. The optional hosted workspace uses Pocket ID for
server saves; fonts and the color engine remain local assets.

The editor is hosted at [colors.arturtrifonov.com](https://colors.arturtrifonov.com).
The owner-requested server package is in [`deploy/colors`](../../deploy/colors/README.md).
It serves this editor and the public `stylos-colors.figma.json` endpoint loaded
by Stylos Tokens. Everyone can open supported JSON and edit/download a local
draft. **Open published colors** loads the public saved palette. **Sign in with
Pocket ID** enables owner-only **Open working copy**, **Save working copy** and
**Publish colors**. A working save stays private until explicitly published.
Browser drafts continue to persist locally, including across sign-in redirects.
The server has its own revision history and rejects stale saves from other tabs.

```sh
npm install
npm run colors          # http://127.0.0.1:4175/
npm run colors:build    # apps/colors/dist/, deployable at any subpath
npm run colors:check    # TypeScript
```

## First slice

- The snapshot is built by `tools/build-colors-data.mjs` through the existing
  canonical loader, including the generated special roles. No HEX is transcribed.
- Palette edits preserve existing token paths, both independent themes and the
  original values. Add row duplicates a numbered ramp in both themes; Add step
  interpolates a new numbered column across every hue. New hue groups receive
  their generated special roles immediately. New rows and steps can be removed
  without withdrawing source tokens. Huetone's OKLCH/CIELCH graphs and numeric controls edit the selected
  ramp. `mono` is displayed separately from numbered ramps.
- Semantic and Special follow the token hierarchy: area, bold/subtle, family,
  then Default / Hover / Active / Disabled in aligned columns. In context previews
  use surfaces as tiles, backgrounds behind a tile, borders as borders, text as
  text and shadows with their real opacity; Swatches shows the resolved colours. Clicking a role opens its palette step.
  Contrast ratios compare the selected pair of opaque colours; they do not
  establish component or interface accessibility. Translucent pairs have no
  ratio until a compositing context is defined.
- Drafts persist locally in this browser. Open JSON / Save draft transfers a
  versioned JSON file between sessions. A SHA-256 fingerprint covers palette, semantic
  and special-scale records; a stale draft is rejected and remains downloadable
  for recovery rather than being silently overwritten.
- Undo / Redo covers HEX and graph edits, bulk commands, row/step additions and
  removals, opening a draft, gamut correction and Reset changes. A continuous
  graph gesture or input edit is one history entry. Ctrl/Cmd+Z undoes;
  Ctrl/Cmd+Shift+Z or Ctrl+Y redoes. Text fields keep their native text undo.
  Reset changes sits beside Light/Dark and resets both themes; Undo recovers the
  draft. History retains up to 60 actions in the current session. Reload restores
  the draft and provides one undo back to source; the full history is not saved.
- The palette grows with the page and has no internal scrolling. On desktop the
  inspector stays beside it and can scroll independently. Color space appears
  first; the introductory hero has been removed from the working area.
- **Grayscale** beside Light/Dark pins a neutral preview; hold **B** for a
  temporary preview, as in Huetone. Releasing B or leaving the window restores
  the unpinned view. Typing in a field keeps its normal keyboard behaviour.
  Samples retain lightness in the selected OKLCH/CIELCH space with chroma set
  to zero, including raw graph coordinates for palette steps. Palette, role
  previews and source/draft samples share this display mode; alpha is retained.
  Graphs and their gamut control keep showing the actual editable colours.
  Token values, contrast calculations, history, exports and server saves are
  unchanged; the preview preference lasts only for this session.
- Changes can be reviewed against current canonical tokens, without writing:

```sh
npm run colors:review -- ~/Downloads/stylos-colors.draft.json
npm run colors:review -- ~/Downloads/stylos-colors.draft.json --out /tmp/stylos-color-preview
```

The review command checks the whole proposed token set through the real CSS
builder, including new generated special families, both themes and alpha.
`--out` creates `review.txt`, `impact.json`, `tokens.css`, `tokens.json` and the
validated `draft.json` in a preview directory. The impact file lists changed
semantic/special values per theme with their binding and opacity. CSS uses the
same sRGB mapping as the browser and reports out-of-gamut points explicitly.
The preview is ready to try in a consumer without changing the source palette.

**Export for Figma…** downloads standard DTCG color JSON for Figma's built-in
Variables → Import mode. Each collection/mode has its own file: `palette.light`,
`palette.dark`, `color` Light/Dark and `color.special` Light/Dark. Import palette
collections first, then the two role collections. Names remain canonical token
paths. The export uses the current draft, including additions, sRGB projections,
alpha and generated Special roles; grayscale is display-only. Standard sRGB
objects carry values, and Figma extensions carry scopes and alias targets by name.
Translucent aliases use the composed-color extension recorded in Figma exports.
The Special files are separate; existing variables are not migrated or deleted.
Tests read the documents with the repository's Figma-export parser, including
both themes, edits, aliases, opacity and additions. Browser QA verifies the actual
download. Native import in the real Figma editor remains owner acceptance.

The server's `/stylos-colors.figma.json` remains the versioned **plugin protocol**,
not a native-import file. It includes the full source, role bindings and graph
coordinates for comparison and round-trip validation. **Advanced → Download
plugin transfer** exports this protocol as `stylos-colors.plugin.json` for an
unpublished draft. [Stylos Tokens](../figma-tokens/README.md) normally reads the
published server endpoint directly. **Open JSON** still accepts matching plugin
transfers and drafts; native DTCG mode files are an outbound export. Canonical
repository updates continue through the existing Figma export and `tokens:import`
path. The editor does not edit semantic bindings, the special scale or consumer
themes in this slice.

`npm run build:publish` builds this app and the workshop before the documentation
site. `npm run build` includes the editor only if its bundle exists, and refreshes
its snapshot and theme from current canonical tokens on every site build. The
editor works from HTTP(S); browser modules require a local server rather than
opening `index.html` directly from disk. Restart `npm run colors` after importing
new canonical tokens to regenerate the development snapshot.

## Upstream

The colour engine, interpolation, graph controls and worker renderer under
`src/huetone/` derive from [Alexey Ardov's Huetone](https://github.com/ardov/huetone),
commit `edb99b2e5c3b65510884ee354888188ec225fbca`. Its MIT notice is retained in
[`LICENSE.huetone`](LICENSE.huetone). Dependencies are managed by the root npm
lockfile; no git submodule or runtime connection to upstream is used.

The Stylos adapter replaces upstream's presets, palette store, app shell and
export. Graph adaptation adds accessible control names, caps the worker pool,
cancels stale renders and releases bitmaps. Colour-space switching is a view
operation and does not rewrite unedited HEX values. Graph edits retain their
original LCH coordinates alongside the sRGB preview. Out-of-sRGB colours are
hatched and labelled; Make colors displayable explicitly accepts Huetone's
chroma-reduced sRGB projection for those points in the active theme. Applying
hue to the row or lightness to the step preserves coordinates too.

The version 2 changes format carries additions with `before: null` in both
modes and an optional coordinate map keyed by `mode:hue/step`. Version 1 drafts
remain readable. The browser checks coordinate/HEX agreement on import and
restore; the read-only CLI shares that projection check and also validates
shape, source fingerprint, coordinate ranges, complete hue/step membership,
both modes and the downstream CSS build. Canonical tokens continue
to contain only sRGB HEX. Large swatches use an outline on hover without motion.
