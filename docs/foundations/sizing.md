# Sizing

Status: **Confirmed.**

## Per-axis decision order

Dimensions are evaluated per axis, in order:

1. If a `size`-type component property controls the dimension, change only that property.
2. If the dimension is variable-bound, preserve the binding or switch to another supported variable.
3. If a fixed, unbound dimension is genuinely external layout capacity, it may be adjusted.
4. Otherwise, preserve the component's intrinsic dimension and resizing behaviour.

Usually adjustable: text-field, search-field, panel and card width; dialog width where the pattern allows. Usually intrinsic: control height, icon-button dimensions, icon size, checkbox and radio indicators, internal actions, internal padding, internal gaps.

Resizing: preserve `Hug contents` unless a documented pattern supports `Fill container`; use `Fill container` only on an axis meant to respond to its parent; preserve min/max constraints and required aspect ratios; never scale an instance to hit a reference measurement.

## The scale, and what the level mapping means

The scale is built in **pixels** on a base of 8, finely subdivided at the small end and coarser as values grow. Values live in [`tokens/`](../../tokens/README.md) under `dimension-scale` and are aliased by the `size` role in `dimension`; `npm run tokens:report dimension-scale dimension` prints them.

**The scale is not expressed in rem, and rem is not part of it.** A rem-based scale makes sense when a component's dimensions derive from its font size. Stylos does not work that way — sizes are set directly — so a relative unit adds a second base to reason about and nothing else.

### The level mapping is a recommendation

Each architectural level has a recommended run of five sizes:

| Level | XS | S | M | L | XL |
| --- | --- | --- | --- | --- | --- |
| Primitive | `s-1_500` | `s-1_750` | `s-2_000` | `s-2_250` | `s-2_500` |
| Element | `s-2_000` | `s-2_250` | `s-2_500` | `s-2_750` | `s-3_000` |
| Object | `s-3_000` | `s-4_000` | `s-5_000` | `s-6_000` | `s-7_000` |

The runs overlap deliberately: the same value serves a large Primitive and a small Element, and a large Element and a small Object.

**This is orientation, not obligation.** It says what a component of that level and size usually is — a medium Object is normally 40px tall — so that a new component built to the recommendation lines up with most of what already exists. That is the whole of its authority.

Every other value on the scale remains available and legitimate. A status indicator showing "online" is 8px, well below the smallest recommended Primitive, because at 12 it would read as enormous. That is not a violation and nothing flags it.

Deviate when the component's visual weight, borders, or treatment call for it. The recommendation exists to make matching easy, not to make deviation wrong.

### Which levels have a shared grid

Only **Element and Object** have a grid that a skill applies mechanically, and that is permanent rather than unfinished. A shared grid can only exist where components at that level have comparable structure; beyond Object they do not. Widget- and Layout-level components — Modal, Alert, Breadcrumbs, Header — are too heterogeneous for a shared rule to mean anything, so their sizing is documented per component.

Primitive has a recommendation, as above, but no skill-enforced grid.

The collection is called `dimension` because it holds both — a control's height and the gap beside it are both lengths in the layout plane. It is not called `space`: a control's height is not spacing.
