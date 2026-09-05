# SPEC 0007 — Tokens to CSS

**Status:** Built — 2026-09-06
**Date:** 2026-09-05

Implements [`PLAN.md`](../../PLAN.md) §Stage 5, first half — the `0.2.0` gate item "tokens are consumable as CSS".

Reads [`tokens/*.yaml`](../../tokens/README.md). Writes one CSS file and one manifest. Nothing here changes Figma, and nothing here changes the canonical token set — this is a projection of the record, not a second record.

---

## 1. What this builds

| | |
| --- | --- |
| `tools/build-css.mjs` | the generator |
| `npm run tokens:css` | runs it |
| `packages/ui/dist/tokens.css` | the output — 957 properties, **not committed** |
| `packages/ui/dist/tokens.json` | the manifest — custom property → canonical token path, **not committed** |

Both are written by `npm run tokens:css` and ignored by git (`packages/*/dist/`). The package's own `prebuild` will call it once the package exists; until then the command is run directly. `--out <dir>` writes elsewhere and `--stdout` writes nothing.

The manifest exists so the name rule stays checkable without being reversible. `--stylos-font-line-height-text-1_000` cannot be parsed back into `font/line height/text/1_000` — `-` stands for both `/` and a space — and it does not need to be, because the generator that produced the name also records where it came from.

Out of scope: font files, the Svelte package, the lint rule that rejects raw values. Those are the second half of Stage 5.

---

## 2. The name rule

```
--stylos- <collection> [-<mode>] -<token path>
```

slugified by exactly three substitutions, applied to the whole string:

1. lowercase
2. `/` → `-`
3. ` ` → `-`

Nothing else is touched. `_` survives, digits survive, `-` already in a name survives.

| Canonical token | Custom property |
| --- | --- |
| `palette/indigo/700` (light) | `--stylos-palette-light-indigo-700` |
| `color/surface/bold/primary/default` | `--stylos-color-surface-bold-primary-default` |
| `font/line height/text/1_000` | `--stylos-font-line-height-text-1_000` |
| `font/size/0_875` | `--stylos-font-size-0_875` |
| `dimension/size/s-2_000` | `--stylos-dimension-size-s-2_000` |
| `radius/extra small` | `--stylos-radius-extra-small` |
| `border/width/normal` | `--stylos-border-width-normal` |

**Two names that slugify to the same string are a build failure**, reported with both canonical paths. The generator does not disambiguate, and it does not rename.

### The `-<mode>` segment

Present only where a collection is emitted **flat and has more than one mode** — which is `palette` and nothing else. Everywhere else the mode is carried by the selector, so it is absent from the name: `--stylos-color-surface-bold-primary-default` is one name that resolves differently per scope, and that is the point of it.

### The prefix

`--stylos-` in full, not an abbreviation, and not configurable at `0.2.0`. It is long; it is also the only thing standing between these properties and a consumer's own. A configurable prefix would put the manifest, the lint rule and every authored component style behind an indirection none of them can resolve at author time.

---

## 3. Units

Every number in Figma is pixels, and [`sizing.md`](../foundations/sizing.md) already rules out rem: *"The scale is not expressed in rem, and rem is not part of it."* So:

| Token type | Emitted as |
| --- | --- |
| `font/weight/*` | bare number |
| every other `number` | the value + `px` |
| `color` | `#rrggbb`, or `rgb(r g b / a)` when alpha < 1 |
| `string` (`font/family/*`) | see below |

Values are emitted verbatim. `radius/round` is `1000px`, not `9999px`; a generator that improves a value is a second source of truth.

**Font families need a fallback stack, and Figma has no field for one.** [`typography.md`](../foundations/typography.md) names the typefaces and not their fallbacks. Authored in the generator, listed here so it is a decision rather than a default:

```css
--stylos-font-family-normal:  "Georama", system-ui, sans-serif;
--stylos-font-family-display: "Georama", system-ui, sans-serif;
--stylos-font-family-code:    "JetBrains Mono", ui-monospace, monospace;
```

---

## 4. Four layers, in emission order

```
palette      flat, unscoped, both modes in the name        576 properties
slots        per mode, in scope                            65 per mode
semantic     per mode, in scope, every role in both        110 per mode
composed     shadows, per mode, in scope                   6 per mode
```

Plus the single-mode collections — `dimension-scale`, `dimension`, `font`, `radius`, `border` — flat and unscoped alongside the palette.

### 4.1 Palette — flat and unscoped

Both palettes are emitted unconditionally in `:root`, as two independent sets, per [`color.md`](../foundations/color.md): *"No selector switches them."*

```css
:root {
  --stylos-palette-light-slate-25: #…;
  …
  --stylos-palette-dark-slate-25: #…;
  …
}
```

22 hue groups × 13 steps + `base/white` + `base/black`, twice. Nothing in the palette is mode-scoped, and nothing in it is conditional.

**`hiddenFromPublishing` has no effect on emission.** The whole palette carries it, so does `dimension.scale`, and both are required — the semantic layer resolves through them. It is a Figma-consumer flag saying "do not offer this in the picker", not a statement about the token set. A generator that skipped hidden variables would emit a semantic layer of dangling `var()`s.

### 4.2 Slots — synthesised here, because Figma has no slot layer

Figma binds roles straight to palette steps: `surface/bold/primary/default` → `indigo/700`. The five slots exist in [`color.md`](../foundations/color.md) as a documented fact about that binding, not as variables. The generator makes the indirection real:

```css
:root {                                    /* light */
  --stylos-slot-primary-25:  var(--stylos-palette-light-indigo-25);
  …
  --stylos-slot-primary-975: var(--stylos-palette-light-indigo-975);
}
```

Five slots × 13 steps = 65 properties, emitted once per mode. Roles then reference the slot, never the palette:

```css
--stylos-color-surface-bold-primary-default: var(--stylos-slot-primary-700);
```

All 13 steps are emitted whether or not a role uses them, so that a client who rebinds a slot gets a complete ramp rather than the subset today's roles happen to touch.

**A rebrand is five bindings and 130 generated lines.** The client writes five, the generator writes the rest, in both scopes. `PLAN.md` says "five bindings rather than 110 overrides" and that is the client-facing count; the mechanism is stated here so nobody expects five lines of CSS.

Which primitive collection a semantic collection resolves through is read from `draws_from` in [`tokens/_naming.yaml`](../../tokens/_naming.yaml) — `color` → `palette`, `dimension` → `dimension-scale`. This build is its first reader; before it, the field was declared and unread, which is how it sat holding two collection names that had not existed since `space` became `dimension`.

**Three rules decide which slot a role takes** — derived from the role name and the alias, never from the value:

| | Rule |
| --- | --- |
| 1 | A role whose path contains `primary`, `success`, `warning`, `danger` or `base` takes that slot — **unless rule 2 applies**. |
| 2 | A role whose last segment is `disabled` takes the `base` slot regardless of what its path says. Eight roles do: `surface/{bold,subtle}/{primary,success,warning,danger}/disabled`, all resolving into slate. [`color.md`](../foundations/color.md): *"A disabled control is structurally inert regardless of what it would have meant enabled."* |
| 3 | A role under `*/special/*` takes **no slot** and references the palette step directly. 44 of them. The hue is the meaning; a rebrand must not move it. |
| 4 | A role naming no slot at all takes `base`. Nine do — `text/{secondary,tertiary,inverted,static-light,static-dark}`, `background/{secondary,tertiary}`, `border/{default,secondary}` — and every one of them is neutral structure already resolving into slate. Without this rule they would be the only roles a rebrand could not reach. |

`background/base` is the fourth case and it is not a slot at all: it resolves into the palette group `base` (`white` in light, `black` in dark), which is a different `base` from the slot ([`color.md`](../foundations/color.md), Open). It references the palette directly, like a `special` role.

**The generator verifies rules 1–4 rather than assuming them.** For every aliasing role in both modes: the slot implied by the name must match the hue group the alias lands in, after the exceptions. A mismatch is a build failure naming the role, the slot and the group it actually reached. Rule 3 is checked in the same pass and from the same direction — a `special` role must reach the hue group its own last segment names, so a `surface/special/violet` rebound to indigo fails rather than quietly becoming a second name for the brand.

The five bindings themselves are authored in `tools/build-css.mjs`, not derived. Derived from the data they would agree with it by construction and check nothing. This makes `color.md`'s central claim — 66 slot-bound roles drawing on exactly five hue groups — a check rather than a sentence, and it is the check that catches a role rebound in Figma to a hue outside its slot.

**Two roles are literals and take no slot:** `color/shadow/base` and `color/shadow/primary`. Figma cannot bind a variable and change its opacity, so they arrive as values. Emitted as values, per mode — they differ: `#000000 3%` in light, `#FFFFFF 3%` in dark. The known cost is unchanged and unfixable here: rebinding the `primary` slot leaves `shadow/primary` on the old brand colour ([`color.md`](../foundations/color.md), Open).

### 4.3 Semantic colour — twice, complete both times

All 110 roles are declared in the light scope and all 110 in the dark scope, including the ones whose value does not change. Per [`color.md`](../foundations/color.md): *"If the dark scope only redeclared the roles that differ, a client override in the light scope would inherit into dark."*

The roles in `mode_dependent` need no special handling — a role emitted per mode resolves per mode by construction. Five of the eight are `surface/bold/*/disabled`, which take a different slate step per mode; slot rule 2 still sends them to the `base` slot, and the step follows the scope. The declaration in `_naming.yaml` remains what it is: a check on Figma, not an input to this build.

### 4.4 The switch — one, global

```css
:root { color-scheme: light; /* light scope */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; /* dark scope */ }
}

:root[data-theme="dark"] { color-scheme: dark; /* dark scope */ }
```

Three states, and an explicit choice beats the system preference in both directions. The dark scope's body is emitted twice, byte-identical — the alternative is a selector list, and a selector list makes an override that targets one of the two selectors silently miss the other.

`color-scheme` is emitted alongside so form controls and scrollbars follow the theme without a second mechanism.

**A dark region inside a light page is not supported** and the selector is why: theming a subtree would mean re-emitting slots and roles per theme-bearing node. [`color.md`](../foundations/color.md) rules it out; this is the shape of that ruling.

### 4.5 Shadows — composed, cumulative

Not exported from Figma and not read from the effect styles. Generated from the two scales in `effect` plus the composition rule in [`effects.md`](../foundations/effects.md): **`elevation N` = layers 1…N in `shadow/color/base`, then layer N repeated in `shadow/color/primary`** — N + 1 layers.

One layer at step *k*: `0  elevation(k)  elevation(k)  spread(k)  <colour>`. X is always 0 and blur equals the Y offset, which is why there is no blur token.

```css
--stylos-shadow-elevation-3:
  0 2px  2px -1px var(--stylos-color-shadow-base),
  0 4px  4px -2px var(--stylos-color-shadow-base),
  0 8px  8px -3px var(--stylos-color-shadow-base),
  0 8px  8px -3px var(--stylos-color-shadow-primary);
```

Six properties, `--stylos-shadow-elevation-1` … `-6`, emitted **inside both scopes** — the colours differ per mode and are referenced, never inlined.

The `effect` collection is emitted too, under the name rule, because a component may want a single offset: twelve numbers, plus the two colour aliases, which are flat and unscoped because `var(--stylos-color-shadow-base)` already resolves per scope. They are inputs to the composition, not a substitute for it: *"A generator that emits one `box-shadow` layer per level produces the wrong thing at every level above 1."*

---

## 5. What is not emitted

- **`meta/version`.** Not a token, never written to `tokens/`, and nothing renders with it ([SPEC 0006](0006-versioning-and-release-0-1-0.md) §6).
- **Nothing else.** Every token in `tokens/*.yaml` becomes a custom property. There is no allowlist, no "unused" pruning, and no size budget. A token the system defines is a token a consumer may use; pruning by current usage would make the CSS a function of the component set instead of the token set.

---

## 6. The withdrawal check belongs upstream, not here

`PLAN.md` asks the CSS build to "fail on a token that disappeared between runs without acknowledgement". It cannot, and it should not:

The CSS is a build result and is not committed, so a comparison "between runs" has no committed baseline to compare against — and giving it one would mean committing generated output, which this repository does not do.

A token disappears at **import**, not at build. `tokens/*.yaml` is committed and is the record; a withdrawal is a line vanishing from a committed file, and `tokens/_history.yaml` already records what each import did. So the check moves to `tools/import-tokens.mjs` and `npm run tokens:check`:

- **import** — an import that removes a token names it and requires `--withdraw <path>` for each, once per token. Without it the import refuses and prints the list. The withdrawal is recorded in `_history.yaml` with the import that carried it.
- **check** — every `ref` resolves. A role pointing at a withdrawn step already fails here; this is existing behaviour and needs nothing.
- **CSS build** — refuses to run on a token set that does not pass `tokens:check`. That is the whole of its responsibility for disappearance.

`PLAN.md` §Stage 5 is corrected to say so.

---

## 7. Naming defects in Figma, and which are worth fixing

Found in the 2026-09-05 exports. None of these block the build — the name rule handles all of them — so the question is only whether the Figma names should read better.

| | Now | Cost of leaving it | Verdict |
| --- | --- | --- | --- |
| `effect` | ~~`shadow/elevation/Level 1`~~ → `shadow/elevation/level-1` | Was Title Case, against [`naming.md`](../foundations/naming.md) §4 and flagged in [`effects.md`](../foundations/effects.md) Open as *"nothing here is deliberate"*. | **Done in Figma, 2026-09-05**, twelve variables. |
| `dimension` | `size/s-2_000`, `gap/g-1_000` | The `s-`/`g-` prefix restates the group it sits in, so the CSS reads `--stylos-dimension-size-s-2_000`. | **Leave it.** `sizing.md` writes the scale as `s-1_500` throughout and the alias target in `dimension.scale` is `s-1_500`; renaming would make three documents and one collection disagree to remove a stutter. |
| `font`, `radius` | `line height`, `letter spacing`, `paragraph spacing`, `extra small` | Spaces, which the slug rule turns into `-`. | **Leave it.** These are the canonical full-word size values [`naming.md`](../foundations/naming.md) §4 requires; the space is correct in Figma and wrong only in CSS, where the rule already handles it. |

One more, which is not a naming defect and needs an answer rather than a verdict:

**22 of the 44 `special` roles were hidden from publishing** — every `surface/special/*` — while every `text/special/*` was visible. Reported as a slip and being fixed in Figma; emission never depended on it (§4.1).

---

## 8. Acceptance

1. `npm run tokens:css` writes `tokens.css` and `tokens.json` from `tokens/*.yaml` alone, with no network and no Figma access.
2. Every custom property in `tokens.css` appears in `tokens.json` with its canonical path; every token in `tokens/*.yaml` except `meta/version` appears in `tokens.css`.
3. Two tokens slugifying to one name fail the build, naming both.
4. A role whose alias contradicts its slot fails the build, naming the role, the slot, and the hue group reached.
5. Every `var()` in the output resolves — no property references a name the file does not define.
6. The light and dark scopes declare the same 110 role names and the same 65 slot names.
7. `--stylos-shadow-elevation-6` has seven layers; `-1` has two.
8. A page setting `data-theme="dark"` on `:root` renders the dark scope with `prefers-color-scheme: light`, and `data-theme="light"` renders the light scope with `prefers-color-scheme: dark`.
9. Rebinding `primary` to `violet` — by redeclaring 13 `--stylos-slot-primary-*` in each scope — moves every slot-bound role and moves no `special` role.
10. `npm run tokens:css` refuses to run when `npm run tokens:check` fails.

---

## 9. Open

- **Component tokens.** Nothing here emits a per-component layer, and `PLAN.md` lever 3 keeps "no component-specific tokens" as the provisional answer. The package will show whether that holds; if it does not, the layer sits between §4.3 and the component styles and this spec is extended rather than replaced.
- **Typography as composed properties.** `font/size/1_000` and `font/line height/text/1_000` are emitted separately, and [`typography.md`](../foundations/typography.md) requires them to be used as a pair. Nothing in CSS enforces the pairing. A composed `font` shorthand per measure would, at the cost of a fourth layer and of the size→measure profiles becoming generated output rather than an authored rule. Deferred until a component gets it wrong.
- **Distribution.** Whether `tokens.css` ships as a file a consumer imports, as part of the package's single stylesheet, or both. A packaging question, answered in the second half of Stage 5.
