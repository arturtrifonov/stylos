# Principles

Status: Partial
Scope: What Stylos values when two options both look defensible; the rules those values produce live in [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md) and [`content/`](content/README.md).

**A principle decides a question the rules do not cover.** The rules settle the cases that have already come up. A principle settles a case that has not, and a new rule has to be consistent with it. A rule that follows from a principle names it in `Serves:` ([`RULES.md`](RULES.md) RUL-03).

Principles sit under the [charter](charter.md) and above the rules. The charter says what the system is for and what it is like; a principle says how a choice is made within that. Neither restates the other: a principle cites the charter for its reasoning rather than repeating it.

---

### PRN-01 — The scale is strict, and a departure is an optical correction

**MUST.** Every dimension, space and step is taken from the scale, and a departure from it is made only where the eye needs one and is named where it is made.

Why: a correction that is not named cannot be told apart from a mistake. A correction with no limit means the scale is no longer a strict module. What that module is for is set out in [charter §Character](charter.md#character).

An optical correction and a raw value are the same act under two names. Both carry the same obligation: each is named, and each is no wider than the case it covers ([`foundations/sizing.md`](foundations/sizing.md), [`foundations/accessibility.md`](foundations/accessibility.md)).

### PRN-02 — A value is chosen as a relation to the base, not as a measurement

**MUST.** A value is chosen by its relation to the base — one base, one and a half, two — never by the pixel count that relation happens to produce.

Why: a decision made in pixels no longer holds when the scale changes, in a density mode, or in a second product. The scale is named in ratios so that people choose the relation and the number follows from it ([`foundations/spacing.md`](foundations/spacing.md)).

### PRN-03 — Density is the case the system is designed for

**MUST.** Where an option looks better with more space around it but makes a dense screen worse, the choice is made for the dense screen.

Why: nearly every default the system sets has a version that looks better on a sparse page. Deciding each default on its own merits produces a system that fails on the only kind of screen it was built for ([charter §Purpose](charter.md#purpose)).

This is not permission to take space away. What a dense screen needs is legibility across many repeated elements, and that usually comes from contrast and rhythm rather than from less space.

### PRN-04 — A binding follows meaning, not appearance

**MUST.** A decision is bound to the role that says what the thing *is*, and two things that look alike but mean different things do not share a binding.

Why: a binding made because of how something looks is correct only for the palette, the theme and the icon set it was made with, and later it can be found only by eye.

The two conversions this system performs both follow this principle. An icon is chosen by function rather than by looking like a reference ([`foundations/icons.md`](foundations/icons.md)). An external reference is reconstructed by mapping its meanings onto Stylos roles rather than by matching how it looks.

### PRN-05 — Judgement where a formula would give a wrong answer

**MUST.** Where deriving a value mechanically would give a wrong answer that looks reasonable, the value is authored by hand and the document says so.

Why: a formula that is nearly right is trusted at exactly the point where it fails. The dark palette is the worked example: a literal inversion of the light ramp is unusable, and no single transform works across all hue groups ([`foundations/color.md`](foundations/color.md)).

This is not permission for an unexplained number. Where a value was decided by eye, the document says so, and says what it was judged against.

### PRN-06 — A product sets content, colour and properties, not Stylos's character

**MUST.** A product supplies its content, supplies its colour through the semantic roles, and sets the properties a component publishes; Stylos keeps anatomy, scale, typography logic, interaction patterns and proportional character.

Why: everything below the customization boundary can be changed for everyone at once, and nobody else has the right to depend on anything below it. Where the boundary runs is set out in [charter §The customization boundary](charter.md#the-customization-boundary).

## Open

- Whether the set needs a principle about where attention goes. Nothing here says what deserves emphasis on a screen where everything competes for it, and `foundations/color.md` decides it per role rather than in general.
