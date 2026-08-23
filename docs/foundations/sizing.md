# Sizing

Status: **Rules confirmed, scale open.**

## Confirmed

Dimensions are evaluated per axis, in order:

1. If a `size`-type component property controls the dimension, change only that property.
2. If the dimension is variable-bound, preserve the binding or switch to another supported variable.
3. If a fixed, unbound dimension is genuinely external layout capacity, it may be adjusted.
4. Otherwise, preserve the component's intrinsic dimension and resizing behavior.

Usually-adjustable: text-field/search-field/panel/card width, supported dialog width. Usually-intrinsic: control height, icon-button dimensions, icon size, checkbox/radio indicators, internal actions, internal padding, internal gaps.

Resizing: preserve `Hug contents` unless a documented pattern supports `Fill container`; use `Fill container` only on an axis meant to respond to its parent; preserve min/max constraints and required aspect ratios; never scale an instance to hit a reference measurement.

**Shared size grids apply to the Element and Object architectural levels only, permanently.** This is a boundary, not an unfinished feature: a shared grid can only exist where the components at that level have comparable structure, and beyond Object they do not. Widget- and Layout-level components (Modal, Alert, Breadcrumbs, Header…) are too heterogeneous in size for a shared rule to mean anything — there's no ground truth to extract, so sizing for those is documented per-component rather than derived from a foundation grid. Primitive-level components have preferred sizes, not a strict grid — see below.

## Primitive preferred sizes

Icon, Badge, Indicator, Loader and similar primitives use: **12, 14, 16, 18, 20**.

This is a reference, not an enforced grid. A primitive may sit outside it where the component it lives in requires that, and no check flags it — which is the difference between this and the Element/Object grids.

## Open

- The final Element/Object size scale, shared with [spacing](spacing.md) ([`PLAN.md`](../../PLAN.md) Stage 1). Note this scale only ever needs to cover Element and Object — see above.

## TODO

- [ ] Document current confirmed size variable values (Element/Object) once the scale is settled.
