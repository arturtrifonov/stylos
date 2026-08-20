# Sizing

Status: **Rules confirmed, scale open.** See master doc [§12.2–12.3](../master-document.md#122-component-sizing-rules).

## Confirmed

Dimensions are evaluated per axis, in order:

1. If a `size`-type component property controls the dimension, change only that property.
2. If the dimension is variable-bound, preserve the binding or switch to another supported variable.
3. If a fixed, unbound dimension is genuinely external layout capacity, it may be adjusted.
4. Otherwise, preserve the component's intrinsic dimension and resizing behavior.

Usually-adjustable: text-field/search-field/panel/card width, supported dialog width. Usually-intrinsic: control height, icon-button dimensions, icon size, checkbox/radio indicators, internal actions, internal padding, internal gaps.

Resizing: preserve `Hug contents` unless a documented pattern supports `Fill container`; use `Fill container` only on an axis meant to respond to its parent; preserve min/max constraints and required aspect ratios; never scale an instance to hit a reference measurement.

## Open

- The final size scale, shared with [spacing](spacing.md) (master doc [§27, item 3](../master-document.md#27-open-decisions)).

## TODO

- [ ] Document current confirmed size variable values once the scale is settled.
