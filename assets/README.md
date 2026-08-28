# assets/

What the generated site is dressed in. Everything here is **copied verbatim into
`build/assets/`** by `npm run build` — nothing is processed, minified or renamed.

The rest of the site's appearance is not here: colour, radius, type scale and
family are resolved from [`tokens/`](../tokens/) on every build by
[`tools/lib/theme.mjs`](../tools/lib/theme.mjs). This directory holds only the
files a stylesheet cannot compute.

| | |
| --- | --- |
| `logo.svg` | the wordmark, drawn in `currentColor` so it takes `--brand` and turns over with the theme |
| `column.png` | the capital on the home page, 510×510 — **optional**; when it is absent the page is built without it and says nothing about it |
| `fonts/` | the two families `tokens/font.yaml` names, self-hosted |

## Fonts

`font/family/normal` is **Georama** and `font/family/code` is **JetBrains Mono**;
both are here as latin and latin-ext subsets of the variable font, so the pages
use the families the system actually declares rather than approximating them.

They are self-hosted rather than linked because the pages are opened from disk
as often as from the web, and `tools/` reaches nothing over the network — a
constraint the tests enforce ([SPEC 0002](../docs/specs/0002-registry-viewer.md)
§4.1). Four files, 116 KB, one shared copy for the whole tree.

Both are licensed under the SIL Open Font License 1.1 — Georama by Font Bureau,
JetBrains Mono by JetBrains — and are redistributable on that basis. They were
taken from the Google Fonts subsets on 2026-08-28; the subset ranges are
recorded in `tools/lib/theme.mjs` beside each file, because a range and its file
are one fact.

A page copied out of the tree on its own loses them and falls back to the system
sans and mono. The whole tree, copied or zipped, keeps working.
