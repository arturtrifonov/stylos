# Principles

Status: Partial
Scope: What Stylos values when two options both look defensible; the rules those values produce live in [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md) and [`content/`](content/README.md).

**A principle decides a call the rules do not reach.** The rules settle the cases that have come up; a principle settles the one that has not, and is what a new rule has to be consistent with. A rule that follows from a principle names it in `Serves:` ([`RULES.md`](RULES.md) RUL-03).

Principles sit under the [charter](charter.md) and above the rules: the charter says what the system is for and what it is like, a principle says how a choice inside that is made. Neither restates the other — a principle cites the charter for its reasoning rather than repeating it.

---

### PRN-01 — The module is strict, and the corrections are optical

**MUST.** Every dimension, space and step is taken from the scale; a departure from it exists only where the eye needs one, and it is named where it is made.

Why: an unnamed correction is indistinguishable from a mistake, and an unbounded one stops the module being a module. What the module is in service of is [charter §Character](charter.md#character).

An optical correction and a raw value are the same act under two names, and both carry the same obligation — named, and no wider than the case ([`foundations/sizing.md`](foundations/sizing.md), [`foundations/accessibility.md`](foundations/accessibility.md)).

### PRN-02 — Decisions are made in relations, not in measurements

**MUST.** A value is chosen by its relation to the base — one base, one and a half, two — never by the pixel count that relation happens to produce.

Why: a decision made in pixels does not survive the scale moving, a density mode, or a second product. The scale is named in ratios so that the relation is what gets chosen and the number is a consequence ([`foundations/spacing.md`](foundations/spacing.md)).

### PRN-03 — Density is the case the system is designed for

**MUST.** Where a decision reads better with air around it and costs a dense screen, the dense screen decides it.

Why: nearly every default the system sets has a version that looks better on a sparse page, and deciding each on its own merits produces a system that fails at the only screen it was built for ([charter §Purpose](charter.md#purpose)).

Not licence to compress: what a dense screen needs is legibility under repetition, which is usually a matter of contrast and rhythm rather than of less space.

### PRN-04 — Meaning binds, not appearance

**MUST.** A decision resolves to the role that says what the thing *is*; two things that look alike and mean differently do not share a binding.

Why: a binding made on appearance is correct exactly once — against the palette, the theme and the icon set it was made against — and afterwards there is no way to find it except by eye.

Both conversions this system performs are this principle: an icon is chosen by function rather than by resemblance to a reference ([`foundations/icons.md`](foundations/icons.md)), and an external reference is reconstructed by mapping its meanings onto Stylos roles rather than by matching its picture.

### PRN-05 — Judgement where a formula would lie

**MUST.** Where a mechanical derivation would produce a defensible-looking wrong answer, the value is authored by hand and the document says it was.

Why: a formula that is nearly right is trusted at exactly the point where it fails. The dark palette is the worked example — a literal inversion of the light ramp is unusable, and no single transform holds across hue groups ([`foundations/color.md`](foundations/color.md)).

Not licence for an unexplained number: what was decided by eye says so, and says against what.

### PRN-06 — The character is not configurable

**MUST.** A product supplies its content, its colour through the slots, and the properties a component publishes; anatomy, scale, typography logic, interaction patterns and proportional character stay Stylos's.

Why: everything below the boundary can be changed for everyone at once, and nothing below it is anyone else's to have depended on. Where the line runs is [charter §The customization boundary](charter.md#the-customization-boundary).

### PRN-07 — The accessibility target is a floor, not a trade

**MUST.** Where visual quality and the conformance target disagree, the target decides and the design changes.

Why: the trade is always on offer — a lower-contrast label is calmer, a smaller hit area is tidier — and a bar that may be traded is not a bar. The target and the browser floor are fixed in [`foundations/accessibility.md`](foundations/accessibility.md), and an exception to them is named and sized like any other.

## Open

- Whether PRN-07 is a principle at all, or a precedence rule that belongs in [`foundations/accessibility.md`](foundations/accessibility.md) beside the target it protects.
- Whether the set needs a principle about where attention is spent — nothing here says what earns emphasis on a screen where everything is competing for it, and `foundations/color.md` decides it per role rather than in general.
