# assets/icons/

The Stylos icon set: one fixed instance, as SVG. Twenty-nine drawings — the marks the Figma library already carries as system components ([SPEC 0012](../../docs/specs/0012-icon-system.md) §2). The set is grown on demand, not stocked.

| Path | Kind |
| --- | --- |
| [`manifest.yaml`](manifest.yaml) | **authored** — the set and the instance it is drawn at |
| `svg/*.svg` | **generated** by `npm run icons:import`, committed, never hand-edited |

The rule that governs both — why the set is SVG rather than an icon font, and why it is one instance rather than an axis exposed to consumers — is [`docs/foundations/icons.md`](../../docs/foundations/icons.md). This file is the mechanics.

## Adding an icon

Add its Material Symbols ligature name to `manifest.yaml`, then:

```bash
npm run icons:import
```

Names come from the [Material Symbols catalogue](https://fonts.google.com/icons). A name that does not shape into exactly one glyph fails the import — an icon that is silently blank is worse than a build that stops. A name listed twice fails it too.

**An icon enters the set when something needs it, never in anticipation.** Adding one is a line and a re-run, so there is no saving in stocking ahead of demand — only files nobody has checked against a real use. The twenty-nine here are what the Figma library already uses in components, read from its system-icon set.

`npm test` checks that `svg/` matches `manifest.yaml`, so editing the manifest without re-running the import fails the gate rather than leaving the tree disagreeing with itself.

## What one file contains

Geometry, and nothing else:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" data-icon="search"><path d="…"/></svg>
```

- **`viewBox="0 -960 960 960"`** is the font's em box with y flipped, which is also what upstream's own SVG exports use — a Stylos icon and a stock Material Symbols icon drop into the same slot.
- **No `width` or `height`.** The size is a token, applied by whatever renders the icon.
- **No `aria-*` and no `role`.** The accessible name lives on the control that holds the icon, never on the icon; the icon is `aria-hidden`. Baking either into the file would make it wrong in a sprite and wrong in a button at the same time.
- **`fill="currentColor"`**, so colour comes from the surrounding text colour and forced-colors mode works without a special case.

## Regenerating

The import needs the packaged variable font (`material-symbols`, a devDependency), decompressed to TrueType in memory and instanced by `fontkit`. Nothing downstream needs it: the SVGs are committed, so an icon change is a commit with a readable diff, the same rule [`assets/fonts/`](../fonts/) follows.
