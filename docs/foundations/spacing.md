# Spacing

Status: Confirmed
Scope: Internal padding, gaps between items and external margins; a component's own dimensions are [sizing.md](sizing.md).

## The scale

Sizes and spacing share the primitive collection `dimension-scale` and the semantic collection `dimension`. Spacing roles belong to `dimension/gap` and use the `g-` prefix; component size roles belong to `dimension/size` and use `s-`. [Sizing](sizing.md) covers those component dimensions.

### FND-SPACING-01 — Spacing steps are ratios to an 8 px base

**MUST.** Name each spacing step as a ratio to the 8 px base, rather than as its pixel measurement, ordinal position or size label.

Why: a ratio names the relation chosen by the designer, so the name remains meaningful when reading or comparing steps (PRN-02).

`g-1_000` means one base and `g-1_500` means one and a half. The underscore is the decimal separator: `g-0_125` means one eighth of the base. Base-8 does not mean every spacing value is a multiple of eight pixels; fractional ratios are part of the scale.

The ratio describes an existing step, not permission to invent any fraction. The available spacing roles live in [`tokens/dimension.yaml`](../../tokens/dimension.yaml); `npm run tokens:report dimension` prints their resolved values. FND-SPACING-02 governs their use.

Serves: PRN-02.

### FND-SPACING-02 — Explicit spacing uses gap tokens

**MUST.** Use a semantic token from `dimension/gap` for every explicitly set padding, gap or margin.

Why: the token identifies a supported spacing role; a matching number or a size token does not carry that role (PRN-04).

A raw number equal to a scale value is still raw. A primitive in `dimension-scale`, or a token in `dimension/size`, is not a substitute for a spacing role. The gap roles form their own supported set; not every primitive has a gap role. Adding a shared spacing role or a missing primitive step is a system decision, rather than a local substitute.

This rule governs spacing that is explicitly set. Free space distributed by a container is calculated from the available room; the resulting distance between items is not itself a chosen spacing value. Any explicit padding or gap used alongside that distribution still follows this rule.

Exception: **Documented optical correction.** A local correction permitted by PRN-01 may depart from a gap token when its purpose and the affected spacing are named where the correction is made; it does not add a shared scale step or permit unrelated raw spacing.

Serves: PRN-01, PRN-04.

### FND-SPACING-03 — Spacing roles alias matching primitives

**MUST.** Define each spacing role in `dimension/gap` as an alias of the `dimension-scale` primitive with the same ratio suffix.

Why: the alias keeps the role's value tied to the shared scale, while the matching suffix makes the relationship readable without resolving the value.

The two layers have different jobs: `dimension-scale` holds the primitive lengths; `dimension` exposes the roles used by components and layouts. For example, `dimension/gap/g-1_500` references `dimension-scale/s-1_500`. The primitive's `s-` prefix does not make it a component size role; those roles are in `dimension/size`.

The role stores a reference, rather than a separate numeric copy. Matching names alone do not keep values in sync; resolving the alias provides the spacing value.
