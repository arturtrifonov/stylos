# docs/foundations/palette/

The three core-palette definition files listed as unresolved in [`CHANGELOG.md`](../../../CHANGELOG.md) ("Known gaps carried over from Downloads"). Their provenance was determined on 22 August 2026 and they are committed here.

## What they are

**Not** a Figma export, and **not** a Tokens Studio export. Their shape is:

```json
{ "name": "stylos core palette light",
  "hues":  [ { "name": "slate", "colors": ["#f8fafc", … 13 values] }, … 22 groups ],
  "tones": ["25","50","100","200","300","400","500","600","700","800","900","950","975"] }
```

That is an **authored palette definition** — 22 hue groups × 13 tones — carrying no Figma variable IDs, no collection or mode metadata, and no `$type`/`$value` structure. It is the kind of file a palette tool produces or a person writes, and it matches exactly the `25`–`975` step structure that [`../color.md`](../color.md) records as confirmed.

They live under `docs/foundations/` rather than `figma/` deliberately: [`figma/README.md`](../../../figma/README.md) states that nothing hand-authored claiming to represent Figma state belongs there. These are an input to Figma, not a record of it.

## Files

| File | Dated | Note |
| --- | --- | --- |
| `stylos-core-palette-light.json` | 2026-06-26 | light core palette |
| `stylos-core-palette-dark.json` | 2026-06-26 | dark-context transform |
| `stylos-core-palette-dark-reversed.json` | 2026-06-26 | a **second, different** dark transform |

## Why two dark palettes is the open question

[`../color.md`](../color.md) and master doc §27 item 9 ask which core-palette transformation is canonical. These files are the reason that question exists — there are two dark transforms, and they disagree substantially:

| Value | light | dark | dark-reversed |
| --- | --- | --- | --- |
| Indigo 600 | `#686cf8` | `#7079d9` | `#9aa8f0` |

`color.md` cites the transform example as `#686CF8` → `#6E77D1`. **That result appears in none of these three files.** Either the example predates them or it was recorded by hand from a different revision; either way it is not reproducible from anything stored, and should be replaced with a value taken from whichever file is confirmed canonical.

The light value `#686cf8` *does* match, so the light palette here and the documented one are the same lineage.

## Relationship to the Figma snapshot

[`figma/variables/exports/2026-08-20/palette.light.json` and `palette.dark.json`](../../../figma/variables/exports/2026-08-20/README.md) are the *live* core palette as it exists in Figma, with variable IDs. These files are the authoring source. Confirming that the two agree — and deciding which dark transform Figma actually carries — is Stage 1 work ([`PLAN.md`](../../../PLAN.md), item 1.4, ADR 0010).

Until then, nothing here is normative. Do not cite a value from these files as a confirmed Stylos color.
