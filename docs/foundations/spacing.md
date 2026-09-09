# Spacing

Status: Confirmed
Scope: The spacing scale and the distance between things; a control's own dimensions are [sizing.md](sizing.md).

## The scale

### FND-SPACING-01 — The scale is base-8, named in ratios to the base

**MUST.** The scale is base-8, and every step is named as a ratio to that base — `s-1_000` is one base, `s-1_500` is one and a half — never as the measurement it produces.

Why: `s-1_500` says "one and a half bases", and that is the point rather than a convenience: the scale exists so that decisions are made in relations rather than in measurements.

Absolute names (`s-12`), ordinals (`s-3`) and T-shirt names all lose that — the first invites reasoning in pixels, the other two hide the ratio entirely. The cost is one multiplication when a pixel value is genuinely needed, which is rare.

Serves: PRN-02.

### FND-SPACING-02 — Spacing is drawn from the scale

**MUST.** A spacing value comes from the scale; a value that is not on the scale is not a spacing value, and adding one is a system decision rather than a local exception.

Why: an off-scale value is one nobody reviewing a screen can see is off-scale, and the moment one exists the scale is advisory. Where the scale is genuinely short of a step, it gains the step for everyone.

Serves: PRN-01.

### FND-SPACING-03 — Two layers: primitives and semantic roles

**MUST.** The scale collection holds the primitives; semantic roles sit beside them, carry a role prefix — `s-` for size, `g-` for gap — and reuse the ratio suffix of the primitive they correspond to.

Why: the shared suffix is what lets a role be read against its primitive without a lookup, so the two layers cannot drift into two different scales.

## Values

**Not transcribed here.** Run `npm run tokens:report` — it renders the current scale from `tokens/`. See [color.md](color.md) for why.

Sizes and gaps share the collection `dimension` — both are lengths in the layout plane. Spacing is the `g-` half of it; control dimensions are the `s-` half, and those are [sizing.md](sizing.md)'s subject.
