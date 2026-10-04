# Sizing in the Figma implementation

The system contract is defined in [Sizing](../docs/foundations/sizing.md). This document describes its Figma representation and the inspection cases that depend on Figma's layout behaviour.

## Applying a contract

Read the component's registry entry before changing an instance. `sizing_model` records the default behaviour of each axis, per-axis adjustment permissions, positioning and the explanation in `intent`.

- Use the exposed property that governs the affected dimension first.
- On an adjustable axis, use the dimension or layout override the contract permits. A default variable binding may be replaced at that external boundary when the contract allows a consumer-chosen value; it does not permit removing internal bindings.
- On other axes, preserve the authored dimension and bindings. Switch variables only where the contract supports that choice.
- Represent `hug` with Hug contents and `fill` with Fill container where the parent supports it. Apply a fixed override only where the contract allows one, and preserve minimums, maximums and required proportions.
- An absolutely positioned layer can still have a fixed or content-sized dimension. Record the root component's positioning separately from its dimensions; an internal overlay does not make the whole component absolute.
- Follow FND-SIZING-05 when reconstructing a reference: changing an adjustable footprint is distinct from using Figma's Scale tool to scale the whole component.

## Scale constraints outside auto layout

An internal layer outside auto layout whose constraint on an axis is `SCALE` may carry an unbound dimension on that axis when it must follow the parent. A variable-bound dimension stays at the variable's value, so this representation uses a raw dimension for the proportional relationship.

This is one way to implement a contract-supported adjustable footprint, such as Button Inner or Loader. Adjustment permission alone does not require all interior layers to scale: an Indicator's mark keeps its own fixed size while its footprint changes.

The exemption is per axis. A horizontal `SCALE` constraint does not exempt height, and a plain-frame parent alone exempts nothing. Padding, radii, strokes and type remain subject to their own bindings. The [integrity-check skill](../skills/src/component-integrity-check/SKILL.md#scale-constrained-dimension) reports the affected dimension as information because it no longer follows a size token.

## Inspecting hidden layers

Inspect sizing where a layer is visible. Figma removes hidden layers from auto-layout flow; a hidden layer can report `layoutSizingHorizontal: FIXED`, and hidden text can report `textAutoResize: NONE`, with dimensions left from its previous state. Those numbers do not establish its visible sizing behaviour.

When the same layer is visible in another variant, inspect that occurrence. If it is hidden in every variant, report once that sizing could not be established. Do not produce a dimension warning for each hidden occurrence.

This limitation concerns width and height only. Hidden layers' colours, radii, strokes and type still need checking because they become visible with the layer.

The [integrity-check skill](../skills/src/component-integrity-check/SKILL.md#raw-numeric-values) owns the reporting procedure, including reading and stating the `dimension/size` boundary for the above-scale exception.
