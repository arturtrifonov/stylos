# Sizing

Status: Draft
Scope: How a component's dimensions are arrived at on each axis and what the size levels mean; the space between components is [spacing.md](spacing.md).

These rules define the sizing contract across implementations. Figma authoring and inspection conventions are in [figma/sizing.md](../../figma/sizing.md).

## What an axis can do

### FND-SIZING-01 — Size and positioning are separate

**MUST.** Record each axis as `hug`, `fixed` or `fill` in `sizing_model.horizontal` and `sizing_model.vertical`, and record participation in layout separately in `sizing_model.positioning`.

Why: how a dimension is chosen and where a component is placed are different decisions. An overlay may have a fixed width and a content-sized height; being outside the flow does not replace either answer.

| Axis value | The dimension is |
| --- | --- |
| `hug` | derived from the contents |
| `fixed` | an explicit length |
| `fill` | derived from the space the parent provides |

`positioning` is `flow` for a component participating in normal layout, or `absolute` for one placed outside that flow. It describes the component's placement, not how its internal layers are positioned. An implementation chooses the positioning mechanism that satisfies that contract.

The axis values describe the default behaviour. A supported override, such as setting a hugging button's width, is recorded in `intent`.

Checked by: `npm run validate:registry` — both axes and positioning must be present and use these values when a sizing model is recorded.

### FND-SIZING-02 — Adjustability is recorded per axis

**MUST.** Record whether the consumer may choose each dimension in `sizing_model.adjustable.horizontal` and `sizing_model.adjustable.vertical`, independently of the axis's default sizing behaviour.

Why: a button can allow an explicit width while keeping its height controlled by `size`. A single flag for the whole component cannot describe that difference. A fixed dimension may be adjustable, and a hugging dimension may allow a supported explicit width.

Each flag is a boolean. `true` permits an external dimension or layout override described in `intent`; `false` keeps the axis governed by its content, parent or public properties. Selecting a supported `size` value is not an external override and does not require `adjustable: true`.

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

### FND-SIZING-08 — Shared size profiles are defaults for Element and Object

**SHOULD.** Use the Element or Object recommendation as the starting profile unless the component's contract records a different mapping.

Why: these levels have enough common structure for a shared starting point. The contract's mapping takes priority because it describes the actual component. Primitive uses the table as a reference only; Widget and Layout have no shared size profile and record sizing per component.

Typography uses the same level boundary (FND-TYPOGRAPHY-09), with its own default and override rules in FND-TYPOGRAPHY-08.

## Exemptions

### FND-SIZING-09 — A fixed dimension above the semantic size scale may be raw

**MAY.** Use a raw fixed width or height above the largest resolved token in `dimension/size`.

Why: the semantic size scale covers component measures. Larger layout dimensions do not need new component tokens merely to give a panel or window more room. The primitive collection and the gap roles do not set this boundary: a primitive step is not automatically a supported component size role.

The exemption covers fixed width and height only. It does not cover padding, gaps, radii, stroke weights or type. An unbound fixed dimension within the semantic size range still needs a supported token unless it is a consumer override permitted by FND-SIZING-03.

The current boundary is resolved from `tokens/dimension.yaml`; it is not copied into this rule. The [integrity-check skill](../../skills/src/component-integrity-check/SKILL.md#raw-numeric-values) defines how a check reads and reports it.

Serves: PRN-01.
