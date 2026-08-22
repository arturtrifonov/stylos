# 2026-08-22 — Figma Variables snapshot

Exported by the project owner on **22 August 2026** from **Stylos / Styles** and handed over directly.

| | |
| --- | --- |
| Source file | [Stylos / Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles) |
| File key | `2OJYDoTE9EAdQKaJAJK9Kt` |
| Format | DTCG (`$type` / `$value`) with `com.figma.variableId` on every token |
| Collections | 9 |
| Files | 10 — one per collection, per mode |
| Tokens | 996 |

Immutable. A correction is a new, later-dated snapshot directory.

Layout mirrors the export: `<collection>/<mode>.tokens.json`. Both the collection name and the mode name are meaningful and are preserved as directory and file names rather than flattened.

## Collections

| Collection | Modes | Tokens/mode | Contents |
| --- | --- | ---: | --- |
| `palette.light` | Value | 288 | 22 hue groups × 13 steps (`25`–`975`) + `base/black`, `base/white` |
| `palette.dark` | Value | 288 | same names, dark-context values |
| `color` | Light Mode, Dark Mode | 110 | semantic roles — `surface`, `text`, `background`, `border`, `shadow` |
| `font` | Mode 1 | 107 | family, size, line height, weight, letter spacing, paragraph spacing |
| `space.scale` | Mode 1 | 33 | spacing primitives |
| `space` | Value | 37 | `size`, `gap` |
| `radius` | Mode 1 | 7 | |
| `border` | Mode 1 | 2 | width |
| `effect` | Mode 1 | 14 | shadow elevation, spread, color |

## Aliases are resolved — and recoverable

**No token in this export carries a reference.** All 996 are resolved values; a semantic colour appears as a raw sRGB triple, not as `{palette.indigo.600}`. This is a property of Figma's export path, not of DTCG — the standard has reference syntax, this exporter does not emit it.

The alias graph is nonetheless recoverable by value matching. The counts below describe **this snapshot only** — re-run `npm run report:tokens` against a newer one rather than trusting these numbers later. What carries forward is the set of invariants, not the tallies.

| Result | Count |
| --- | ---: |
| Semantic colour matches exactly **one** palette entry | 108 / 110 |
| Ambiguous — matches two or more palette entries | **0** |
| Same palette **step name** in both Light and Dark | 105 / 110 |
| Genuinely mode-dependent | 3 — `text/static-light`, `text/static-dark`, `background/base` |
| Unrecoverable — alpha derivatives | 2 — `shadow/base`, `shadow/primary` (e.g. indigo 700 at 4%) |

Both palettes carry **identical name sets** (288 = 288, no differences), and both colour modes carry identical name sets (110 = 110).

### Why that matters for the token pipeline

Because step names are stable across modes, the generated CSS can keep the layer that consumer-level rebranding depends on ([ADR 0004](../../../docs/decisions/0004-frontend-library-foundations.md)):

```css
:root                { --palette-slate-25: #f8fafc; /* … 288 */ }
[data-theme="dark"]  { --palette-slate-25: /* dark value */;     }

:root { --surface-base: var(--palette-slate-25); }   /* 105 of 110 — mode-independent */
```

Only the three mode-dependent roles need per-scope overrides, and the two alpha derivatives need an explicit declaration. A client rebrand then means overriding the palette, not 110 semantic tokens per mode.

**Reconstruction is inference, not record.** The pipeline script must assert its own invariants and fail the build when they break:

1. every semantic token matches exactly one palette entry;
2. the matched step name is identical in both modes, except for a declared allow-list (currently three);
3. alpha derivatives are declared explicitly, not guessed.

Without those assertions a future value collision would silently emit wrong CSS instead of failing.

## Relationship to `2026-02-22.json`

Different format — that file is a raw plugin export (`{variables, collections, exportedAt, pluginVersion}`) which preserves `VARIABLE_ALIAS` references directly. It remains the only stored export carrying the alias graph as a record rather than as an inference. It is also six months older and does not reflect the current library.

Given the recovery results above, a plugin-format export is **not** required for the pipeline. One export format is enough.
