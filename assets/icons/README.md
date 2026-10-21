# assets/icons/

The current default Stylos icon preset: one fixed Material Symbols Rounded
instance, delivered as SVG. The whole catalogue is available — every name the
pinned `material-symbols` package declares, about 3,900 marks — and a short
list of them is registered by default.

| Path | Kind |
| --- | --- |
| [`manifest.yaml`](manifest.yaml) | **authored** — the instance the preset is drawn at, and the marks registered by default |

Nothing else here is committed. `npm run ui:generate` draws the catalogue from
the pinned font in about a second (`tools/build-ui-icons.mjs`):

| Output | What it is |
| --- | --- |
| `packages/ui/dist/icons/<name>.js` + `.d.ts` | one module per mark, imported and registered by a consumer |
| `packages/ui/dist/icons/<name>.svg` | the same mark as a file, for static HTML |
| `packages/ui/src/components/icon/icons.ts` | the registered marks, which `<Icon name>` resolves without an import, and the `IconName` union |

The foundation rules — one declared preset, SVG delivery, the whole preset
reproduced from its declaration, accessibility and replacement — are in
[`docs/foundations/icons.md`](../../docs/foundations/icons.md). How a consumer
registers a mark is in the [package guide](../../packages/ui/README.md#icons).
This file documents the mechanics of the current default preset.

## Using any mark

Nothing has to be added here. Pick a name from the [Material Symbols
catalogue](https://fonts.google.com/icons), import `@stylos/ui/icons/<name>`
and register it. A name the package declares but the face does not shape into
exactly one glyph is skipped and reported by the build.

## Registering a mark by default

Add its name under `registered` when a Stylos component renders it or the Figma
library carries it as a system component. Those marks resolve without the
consumer importing them, so the list stays as short as that need. A registered
name that does not resolve to exactly one glyph stops the build — a component
showing a blank icon is worse than a build that stops. A name listed twice
stops it too.

## What one drawing contains

Geometry, and nothing else:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" data-icon="search"><path d="…"/></svg>
```

- **`viewBox="0 -960 960 960"`** is the font's em box with y flipped, which is also what upstream's own SVG exports use — a Stylos icon and a stock Material Symbols icon drop into the same slot.
- **No `width` or `height`.** The size is a token, applied by whatever renders the icon.
- **No `aria-*` and no `role`.** The accessible name lives on the control that holds the icon, never on the icon; the icon is `aria-hidden`. Baking either into the file would make it wrong in a sprite and wrong in a button at the same time.
- **`fill="currentColor"`**, so colour comes from the surrounding text colour and forced-colors mode works without a special case.

## Reproducing it

The generator needs the packaged variable font (`material-symbols`, a
devDependency pinned by `package-lock.json`), decompressed to TrueType in memory
and instanced by `fontkit`. The manifest and the pinned version reproduce every
drawing, so a change to the drawings is a change to one of those two. Updating
the font package can redraw marks and add or remove names; review the release
notes of the package before bumping it.
