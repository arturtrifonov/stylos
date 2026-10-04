# Sizing

Status: Draft
Scope: How a component's dimensions are arrived at on each axis and what the size levels mean; the space between components is [spacing.md](spacing.md).

These rules define the sizing contract across implementations. Figma authoring and inspection conventions are in [figma/sizing.md](../../figma/sizing.md).

## What an axis can do

### FND-SIZING-01 — Each axis has one of three sizing types

**MUST.** Record how each axis gets its dimension as `hug`, `fixed` or `fill` in `sizing_model.horizontal` and `sizing_model.vertical`.

Why: the type explains where a dimension comes from. It does not say whether the consumer may change it or which control they use; those decisions are recorded separately.

| Type | How the dimension is chosen |
| --- | --- |
| `hug` | The contents determine it. |
| `fixed` | An explicit length determines it. |
| `fill` | The space provided by the parent determines it. |

A `fixed` dimension may have one value, switch between the values defined for `size`, or accept a consumer-chosen value. For example, Button height changes between its supported sizes, while Icon's footprint can accept a chosen dimension. Both are still `fixed`: changing the number does not change how the dimension is determined.

The axes describe default behaviour. A supported override, such as setting a hugging button's width, is recorded in `intent`.

Checked by: `npm run validate:registry` — both axes must be present and use one of these three types when a sizing model is recorded.

### FND-SIZING-02 — Each axis records how its dimension may change

**MUST.** Record each axis's supported size choices in its public API and its permission for a consumer-chosen dimension in `sizing_model.adjustable.horizontal` or `sizing_model.adjustable.vertical`.

Why: a button can allow an explicit width while keeping its height controlled by `size`. A single flag for the whole component cannot describe that difference. A fixed dimension may be adjustable, and a hugging dimension may allow a supported explicit width.

For a fixed dimension, there are three cases:

- **One fixed value:** no size choice and no external adjustment.
- **A defined size set:** the public `size` property chooses among the supported values. The dimension remains fixed at each choice.
- **A consumer-chosen value:** the relevant `adjustable` flag is `true`; `intent` describes the external dimension or layout override and its limits.

The flags are booleans for the third case. `false` does not mean the dimension can never change: content, the parent or a public `size` property may still determine it. A component can support both a size set and an external adjustment where the contract allows that combination.

The contract also records any relationship between the axes, such as a required square footprint or aspect ratio. Permission to choose a dimension does not remove those constraints.

Checked by: `npm run validate:registry` — both adjustment flags must be booleans.

## Per-axis decision order

### FND-SIZING-03 — The contract decides how an axis may change

**MUST.** Change an axis through the controls or external adjustments its contract supports, in this order:

1. Use the public property that governs the affected dimension, where one exists.
2. For an adjustable axis, use the external dimension or layout override described in `intent`.
3. Otherwise, keep the component's default dimension and sizing behaviour.

Why: the contract explains which changes preserve the component. A default token binding does not prohibit a supported consumer override, and an unbound number does not grant permission to resize an axis.

For Button, `size` governs height while the consumer may choose width. Icon, Loader and Button Inner allow a consumer-chosen footprint. Their contracts describe how the interior follows it. Internal padding, gaps, type and mark sizes keep their own rules unless the contract exposes a control for them.

### FND-SIZING-04 — Supported resizing preserves constraints

**MUST.** Respect the contract's sizing behaviour, minimum and maximum constraints, and required aspect ratios when applying a supported adjustment.

Why: changing a dimension must preserve the relationships that make the component work. A supported width override may replace `hug` with `fixed`; changing an unrelated axis or dropping its constraints is a different change.

Serves: PRN-06.

### FND-SIZING-05 — A reference does not authorize scaling the whole component

**MUST.** Use supported sizing controls rather than scaling a component's whole geometry to match a reference measurement.

Why: whole-component scaling changes padding, type, strokes and other internal measures together, bypassing their tokens and public controls. Matching the reference's outer bounds does not justify those changes.

Resizing an adjustable footprint, with the interior responding as its contract requires, is supported resizing. For example, an icon drawing may follow its footprint while a status indicator's mark keeps its own size.

Serves: PRN-04.

## The scale, and what the level mapping means

### FND-SIZING-06 — Component dimensions use the base-8 pixel scale

**MUST.** Choose token-backed component dimensions from the base-8 pixel scale, rather than a scale derived from `rem`.

Why: Stylos defines these lengths directly. A `rem` scale would introduce a dependency on the root font size; the pixel scale keeps component dimensions independent of that setting.

Exception: **Contract-controlled and above-scale dimensions.** Consumer-chosen dimensions follow FND-SIZING-03, and fixed dimensions above the semantic size scale follow FND-SIZING-09.

Values live in [`tokens/`](../../tokens/README.md) under `dimension-scale`; the supported component size roles are in `dimension/size`. `npm run tokens:report dimension-scale dimension` prints them.

Sizes and gaps share the collection `dimension` because both are lengths in the layout plane. Its `size` group covers component dimensions; its `gap` group is covered by [spacing.md](spacing.md).

### FND-SIZING-07 — The level mapping is a recommendation

**MAY.** Choose a supported size token outside the level recommendation when the component's contract calls for it.

| Level | Extra small | Small | Medium | Large | Extra large |
| --- | --- | --- | --- | --- | --- |
| Primitive | `s-1_500` | `s-1_750` | `s-2_000` | `s-2_250` | `s-2_500` |
| Element | `s-2_000` | `s-2_500` | `s-3_000` | `s-3_500` | `s-4_000` |
| Object | `s-3_000` | `s-4_000` | `s-5_000` | `s-6_000` | `s-7_000` |

Why: shared starting points help components line up, but their structure and visual weight may require a different mapping. A status indicator can use `s-1_000`, below the recommended Primitive row. Its contract records that choice; departing from the table is not a violation.

The values refer to the `size` group in `dimension`. The contract says which dimension they govern: a square footprint, a control's height, or another named part. They are not a requirement to make both axes equal.

The rows share two values at each boundary: `s-2_000` and `s-2_500` for Primitive and Element, and `s-3_000` and `s-4_000` for Element and Object.

### FND-SIZING-08 — Start Element and Object sizing from their recommended rows

**SHOULD.** Start an Element or Object component with its row in FND-SIZING-07 unless its contract specifies different size values.

Why: components at these levels often need to line up with each other. A common starting row makes that easier, while a documented component mapping takes priority over the row.

For a new Object button, start with the Object row for its height, then record any required differences in its contract. The row does not prescribe its width or the size of every internal part. Primitive's row is a reference, without a default to follow. Widget and Layout have no shared row: a modal's dimensions, for example, are defined by its own contract.

Typography uses the same level boundary (FND-TYPOGRAPHY-09), with its own default and override rules in FND-TYPOGRAPHY-08.

## Exemptions

### FND-SIZING-09 — A fixed dimension above the semantic size scale may be raw

**MAY.** Use a raw fixed width or height above the largest resolved token in `dimension/size`.

Why: the semantic size scale covers component measures. Larger layout dimensions do not need new component tokens merely to give a panel or window more room. The primitive collection and the gap roles do not set this boundary: a primitive step is not automatically a supported component size role.

The exemption covers fixed width and height only. It does not cover padding, gaps, radii, stroke weights or type. An unbound fixed dimension within the semantic size range still needs a supported token unless it is a consumer override permitted by FND-SIZING-03.

The current boundary is resolved from `tokens/dimension.yaml`; it is not copied into this rule. The [integrity-check skill](../../skills/src/component-integrity-check/SKILL.md#raw-numeric-values) defines how a check reads and reports it.

Serves: PRN-01.
