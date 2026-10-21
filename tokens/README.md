# tokens/

The canonical token set — **the record**, and the contract everything downstream reads. Written by `tools/import-tokens.mjs` straight from a Figma export, using the authored declarations described below.

Figma is the source of the exported collections; this is the repository's record of them. Nothing sits in between: the exported files are read once at import and never committed, because a directory of exports collected one collection at a time is not an export of anything.

How it works and why it is shaped this way: SPEC 0001.

## Files

| | |
| --- | --- |
| `_naming.yaml` | **authored.** Which Figma collection and mode each canonical one comes from, and which roles may legitimately differ per mode. |
| `_styles.yaml` | **recorded from Figma styles.** Effect styles omitted by variable exports, with source IDs, ordered layers and theme colours. Maintained separately from collection imports. |
| `_special.yaml` | **authored.** The step scale the special colour roles are generated from, for every palette hue group (FND-COLOR-14). Never imported. |
| `_history.yaml` | **generated.** A line per import: when, which collection, how many tokens, what it did. |
| everything else | **generated.** Overwritten by `npm run tokens:import`. Never hand-edit — your change is gone at the next import, and the file says so at the top. |

The `_` prefix marks the files the pipeline treats specially, not the authored ones: `_naming.yaml`, `_special.yaml` and `_surface-motion.yaml` are authored, `_styles.yaml` records styles, and `_history.yaml` is generated. Everything without the prefix is a canonical collection, and every one of those is generated.

`focus/base` is emitted from `_styles.yaml` as the composite token
`--stylos-focus-base`. Its halo preserves the original `Focus/Primary` values
and 16% alpha in both themes. The two other layers reference the canonical
`color/shadow/primary` and `color/shadow/base` roles. Style geometry is recorded
directly; no replacement dimensions or palette bindings are inferred. Update
this record from the Figma style when it changes. `tokens:check` validates both
themes and colour references; `tokens:css` includes style provenance in its manifest.

## Authored surface motion profile

`_surface-motion.yaml` records the owner's 2026-10-11 system decision under
FND-MOTION-19. It is separate from Figma exports and does not claim a Figma
variable id. It assigns an existing semantic gap token and an explicit initial
scale to every level from 0 through 6. The CSS build projects those records to
`--stylos-motion-surface-layer-N-shift` and `scale`, without level arithmetic.
Window-edge attachment selects FND-MOTION-18 independently; level 5 also has
a general profile for other attachments. `tokens:check` validates the complete
mapping and references; `tokens:report motion` renders current values.

## Authored special colour scale

`_special.yaml` records the owner's 2026-10-21 decision under FND-COLOR-14:
categorical colour has a fixed scale of its own, starting from the steps the
`warning` roles had in that day's export. Each entry is a role template with
`{hue}` where the hue group goes and the palette step it takes per mode —
`default`, or one per mode, as in the record. Loading the canonical set
generates every template for every palette hue group except `mono`, in palette
order, and places the result in `color` after that area's recorded roles: 11
templates × 22 hue groups = 242 roles. They behave like any other role
downstream, and `tokens.json` marks them as generated.

A `color` import never records a `*/special/*` variable. It drops Figma's copy,
warns where that copy's names or steps differ from the generated family, and
treats generated roles as surviving the import. `tokens:check` validates the
scale against the palette — every step it generates must exist for every hue
group — and fails if `color.yaml` records a special role. `tokens:report color`
shows the generated roles with the rest.

## The nine canonical collections

Figma's ten collections fold into nine. The folding is declared in `_naming.yaml`, never inferred.

| File | Layer | Modes | From |
| --- | --- | --- | --- |
| `palette.yaml` | primitive | `light`, `dark` | `palette.light` + `palette.dark` — two Figma collections, one canonical palette |
| `color.yaml` | semantic | `light`, `dark` | `color` |
| `motion.yaml` | primitive | `default` | `motion` — the supplied export names its mode `Mode 1` |
| `dimension-scale.yaml` | primitive | `default` | `dimension.scale` |
| `dimension.yaml` | semantic | `default` | `dimension` |
| `font.yaml` | primitive | `default` | `font` |
| `radius.yaml` | primitive | `default` | `radius` |
| `effect.yaml` | primitive | `default` | `effect` |
| `border.yaml` | primitive | `default` | `border` |

The two palettes are separate in Figma so a semantic role can bind to a *different step* per mode, not merely to a different value of the same step — `text/static-light` is `slate/25` in light and `slate/975` in dark.

## References come from Figma, not from a map

Every reference in `tokens/*.yaml` is read from `com.figma.aliasData` in the export — Figma records what each variable is bound to. There is no authored alias map, and nothing is inferred by matching values.

A token that Figma binds to another stores **only the reference**; the value is obtained by following it. Storing the resolved value beside it would be a cache of a derived fact, and a cache is a thing that goes stale.

A binding that carries its own opacity — Figma's composed colour, which the shadow colours use — is stored as the reference **and** an `alpha`, never as the colour that results. The alpha recorded is the opacity applied at that binding, not the composed value: `resolve()` multiplies an alpha in on every hop it passes, so a step that is itself translucent contributes its own where it is resolved. An opacity that is itself bound to a variable fails the import rather than being flattened.

A colour Figma did not bind at all is a literal, and is taken exactly as exported. No colour role is one today.

## Commands

Motion durations retain their exported `{value, unit}` as a nested YAML mapping,
including `ms` or `s`. Easing values retain the supplied `linear` or
`cubic-bezier(...)` string. Import and canonical checks validate both types;
the CSS build emits duration units and unquoted easing expressions under
`--stylos-motion-*`. The export contains no visual-delay tokens, so none are
invented. Behavioural waits remain separate from these transition parameters.

```bash
npm run tokens:import -- --collection radius ~/Downloads/"Mode 1.tokens.json"
npm run tokens:check              # verify the set against itself
npm run tokens:check -- --strict  # also fail on warnings
npm run tokens:report             # render current values as Markdown
```

Import replaces the collections you name and leaves the rest alone. A collection with several modes — `palette`, `color` — must be imported whole, since importing one mode alone would leave the other at a different moment in time.
