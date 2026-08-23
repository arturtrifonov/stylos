# tokens/

The canonical token set — **the record**, and the contract everything downstream reads. Written by `tools/import-tokens.mjs` straight from a Figma export, using the two authored files here.

Figma is the source of truth; this is the repository's record of it. Nothing sits in between: the exported files are read once at import and never committed, because a directory of exports collected one collection at a time is not an export of anything.

How it works and why it is shaped this way: [SPEC 0001](../docs/specs/0001-token-pipeline.md).

## Two kinds of file

| | |
| --- | --- |
| `_naming.yaml` | **authored.** Which Figma collection and mode each canonical one comes from, and which roles may legitimately differ per mode. |
| `_history.yaml` | **generated.** A line per import: when, which collection, how many tokens, what it did. |
| everything else | **generated.** Overwritten by `npm run tokens:import`. Never hand-edit — your change is gone at the next import, and the file says so at the top. |

The `_` prefix marks the authored ones.

## The eight canonical collections

Figma's nine collections fold into eight. The folding is declared in `_naming.yaml`, never inferred.

| File | Layer | Modes | From |
| --- | --- | --- | --- |
| `palette.yaml` | primitive | `light`, `dark` | `palette.light` + `palette.dark` — two Figma collections, one canonical palette |
| `color.yaml` | semantic | `light`, `dark` | `color` |
| `space-scale.yaml` | primitive | `default` | `space.scale` |
| `space.yaml` | semantic | `default` | `space` |
| `font.yaml` | primitive | `default` | `font` |
| `radius.yaml` | primitive | `default` | `radius` |
| `effect.yaml` | primitive | `default` | `effect` |
| `border.yaml` | primitive | `default` | `border` |

The two palettes are separate in Figma so a semantic role can bind to a *different step* per mode, not merely to a different value of the same step — `text/static-light` is `slate/25` in light and `slate/975` in dark.

## Why `ref` and `values` are both stored

`ref` is the contract; `values` is what Figma resolved it to. The redundancy is deliberate, and it is what makes this set self-verifying: `npm run tokens:check` compares every `ref` against the value stored beside it — 257 pairs today — needing no Figma export at all.

That is why nothing raw is kept. A check that reads a months-old export tells you nothing about Figma today; a check that reads the record tells you the record is internally sound, which is the only thing a repository can honestly claim. Whether Figma itself has moved on is answered by exporting again, not by consulting an old file.

## References come from Figma, not from a map

Every reference in `tokens/*.yaml` is read from `com.figma.aliasData` in the export — Figma records what each variable is bound to. There is no authored alias map, and nothing is inferred by matching values.

A token that Figma binds to another stores **only the reference**; the value is obtained by following it. Storing the resolved value beside it would be a cache of a derived fact, and a cache is a thing that goes stale.

A colour Figma could not bind — it cannot bind a variable and change its opacity at once, which is how translucent shadow colours end up stored — is a literal, and is taken exactly as exported.

## Commands

```bash
npm run tokens:import -- --collection radius ~/Downloads/"Mode 1.tokens.json"
npm run tokens:check              # verify the set against itself
npm run tokens:check -- --strict  # also fail on warnings
npm run tokens:report             # render current values as Markdown
```

Import replaces the collections you name and leaves the rest alone. A collection with several modes — `palette`, `color` — must be imported whole, since importing one mode alone would leave the other at a different moment in time.
