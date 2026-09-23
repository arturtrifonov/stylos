# Spacing

Status: Confirmed
Scope: The spacing scale and the distance between things; a control's own dimensions are [sizing.md](sizing.md).

## The scale

### FND-SPACING-01 — The scale is base-8, named in ratios to the base

**MUST.** The scale is base-8, and every step is named as a ratio to that base, never as the measurement it produces: `s-1_000` is one base, `s-1_500` is one and a half.

Why: `s-1_500` says "one and a half bases", and that is the purpose of the name, not a convenience: the scale exists so that decisions are made in relations, not in measurements.

Absolute names (`s-12`), ordinals (`s-3`) and T-shirt names all lose that. An absolute name invites reasoning in pixels, and the other two hide the ratio completely. The cost is one multiplication when a pixel value is really needed, which is rare.

Serves: PRN-02.

### FND-SPACING-02 — Spacing is drawn from the scale

**MUST.** A spacing value comes from the scale; a value that is not on the scale is not a spacing value, and adding a value to the scale is a decision for the whole system, not a local exception.

Why: nobody reviewing a screen can see that a value is off the scale, and once one off-scale value exists, the scale is only a suggestion. Where the scale really lacks a step, the scale gains that step for everyone.

Serves: PRN-01.

### FND-SPACING-03 — Two layers: primitives and semantic roles

**MUST.** The scale collection holds the primitives; semantic roles sit beside them, carry a role prefix (`s-` for size, `g-` for gap) and reuse the ratio suffix of the primitive they correspond to.

Why: the shared suffix lets a reader match a role to its primitive without looking it up, so the two layers cannot drift into two different scales.

## Values

**Not copied here.** Run `npm run tokens:report`, which renders the current scale from `tokens/`. See [color.md](color.md) for why.

Sizes and gaps share the collection `dimension`, because both are lengths in the layout plane. Spacing is the `g-` half of it. Control dimensions are the `s-` half, and [sizing.md](sizing.md) covers them.
