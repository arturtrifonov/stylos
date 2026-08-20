---
name: stylos-component-integrity-check
description: "Audit selected Figma components, component sets, instances, or several same-type components for broken variable, style, and component references; stale instance states; detached instances; invalid variable modes and component properties; raw numeric or color values; and allowed exceptional sizing patterns. Use after variables, styles, components, or libraries have been updated, or when bindings and parameters may have become disconnected. Report errors, warnings, and non-blocking information only; do not modify the selection."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.2
---

# Stylos Component Integrity Check

Audit the current Figma selection for broken design-system references and values that have become detached from variables or styles.

Treat this as a read-only health check. Do not reset instances, replace components, bind variables, apply styles, accept library updates, or otherwise modify the file unless the user explicitly requests a separate repair step.

## Scope

Process the current selection.

- For a component set, inspect every variant and all descendants, including hidden layers.
- For a main component, inspect the component and all descendants.
- For an instance, inspect the instance, its overrides, component properties, nested instances, and all descendants.
- For several selected components or instances, inspect each root independently. If they are clearly the same component type, group repeated findings in the report.
- Do not inspect unrelated objects elsewhere on the page.
- Do not traverse into a source component outside the selection except to resolve whether a reference, property, variant, or default still exists.

If nothing is selected, ask the user to select one or more components. If the selection contains unrelated object types and the intended scope is unclear, ask which roots to inspect.

For a selected component set, do not audit the set wrapper's canvas position or its purely organizational bounds. Audit the actual variants and their contents.

## Audit workflow

1. Identify every selected root and build a complete descendant inventory.
2. Inventory all variable bindings, style references, explicit variable modes, components, nested instances, component properties, variant properties, overrides, numeric properties, and colors in scope.
3. Resolve every referenced asset by its stable reference or ID. Do not rely on a matching name alone.
4. Attempt to load or access remote references before calling them missing.
5. Validate instance and component-property state against the current source definition.
6. Detect raw token-relevant numeric values and colors, then apply the dimension exceptions defined below.
7. Classify findings as errors, warnings, or non-blocking information.
8. Return findings only. Do not repair them.

## Reference resolution rules

### Variables

Inspect every direct or inferred variable reference, including bindings used by:

- fills and text-range fills
- strokes
- effects
- layout grids
- opacity
- dimensions
- auto-layout properties
- corner radii
- typography
- component properties
- explicit variable modes

Resolve the complete alias chain, not only the first variable. For every relevant resolved mode, confirm that:

- the variable exists
- its collection exists
- the active or explicitly selected mode exists
- the variable has a value for that mode
- every alias target exists and resolves without a broken chain

Do not report a variable as missing merely because it was not returned by an initial search. Try direct reference resolution and library access first.

### Styles

Inspect every non-empty paint, text, effect, and layout-grid style reference. Confirm that the referenced style exists and is accessible.

When a deleted style has already detached, Figma may retain the appearance as raw properties and remove the style reference. In that case, report the resulting raw color or numeric values. Do not claim which style was deleted without evidence.

### Components

Inspect every instance and every component reference used by instance-swap properties, including current values, defaults, and preferred values.

Confirm that:

- the main component or variant still exists
- the source component set still exists
- the current variant combination is supported
- instance-swap targets still resolve
- component-property values are supported by the current definition
- component-property references point to existing definitions of the correct type

Do not treat a normal valid override as an integrity problem.

## Errors

The checks below define error classes. Their summaries are examples, not fixed report templates or an exhaustive vocabulary. Generate a concise English summary that accurately describes the confirmed root cause.

### Missing variables

Example summary:

`Error: A bound variable no longer exists`

Use this error when a directly bound variable, its required collection, or a variable referenced in an alias chain cannot be resolved after a direct access attempt. Use the invalid-variable-mode error when the variable exists but its active mode or value does not.

Include:

- selected root
- full layer path
- affected property
- variable name when available
- unresolved reference or ID when the name is unavailable
- whether the break is direct, in an alias chain, or mode-specific

If Figma has already detached the variable and only a raw value remains, use the applicable raw-value warning instead. Do not infer a deleted variable from the raw value alone.

### Missing components

Example summary:

`Error: An instance or component property uses a component that no longer exists`

Use this error when:

- an instance no longer resolves to its main component or variant
- an instance-swap current value no longer resolves
- an instance-swap default no longer resolves
- an instance-swap preferred component or component set no longer resolves
- an instance still points to a deleted variant

Include the instance path, affected property when applicable, and the unresolved component name, key, or ID.

### Invalid instance state requiring reset

Example summary:

`Error: An instance uses a component configuration that is no longer supported and requires Reset to default`

Use this error only when the current instance state is incompatible with the current source definition, for example:

- a stored variant value or combination no longer exists
- an override or nested-instance state refers to a removed structural layer or property
- the instance retains a component format that the current component set can no longer produce
- Figma explicitly marks the instance or property as invalid and resetting it restores a valid source state

Do not report this error merely because an instance has overrides or because the Reset action is available. Confirm that the current state is invalid, not merely customized.

### Missing styles

Example summary:

`Error: An applied style no longer exists or is inaccessible`

Use this error when a non-empty style reference cannot be resolved after checking direct access and its source library.

If the style reference has already been removed and only raw properties remain, report the applicable raw-value warning instead.

### Broken component-property references

Example summary:

`Error: A component property references a property that no longer exists`

Use this error when:

- a layer's text, visibility, or instance-swap property references a missing component-property definition
- the referenced definition exists but has an incompatible property type
- an instance contains a component-property key or value no longer supported by its current source

Include both the layer path and the missing or incompatible property.

### Invalid variable modes

Example summary:

`Error: A variable mode no longer exists or has no resolvable value`

Use this error when an explicit mode override points to a missing collection or mode, or a bound variable cannot resolve a value in the active mode.

### Invalid component-set configuration

Example summary:

`Error: The component set contains an invalid variant configuration`

Use this error when the selected component set has a confirmed corrupted configuration, such as duplicate variant combinations, malformed variant properties, or a variant that cannot be represented by the set's current property definitions.

## Warnings

The checks below define warning classes. Their summaries are examples, not fixed report templates or an exhaustive vocabulary. Generate a concise English summary that matches the actual finding.

### Raw numeric values

Example summary:

`Warning: A numeric value is not bound to a variable`

Report every active, token-relevant, non-zero numeric value that is neither directly bound to a variable nor inferred from a variable through a valid style.

Inspect, when applicable:

- fixed width, height, minimum, and maximum dimensions
- auto-layout padding and gaps
- corner radii
- active stroke weights
- non-default layer opacity
- font size
- numeric line height
- letter spacing
- paragraph spacing and indentation
- numeric effect parameters
- numeric layout-grid measurements

Treat a numeric value as variable-backed when the binding is direct or Figma can prove it is inferred through a valid style backed by a variable.

Do not treat a plain text, effect, or grid style with a hard-coded number as satisfying this rule. The numeric value itself must resolve to a variable.

Do not report:

- `0`
- `Auto`, `Hug`, `Fill`, mixed, or non-numeric values
- dimensions calculated by auto layout or text resizing rather than explicitly fixed
- canvas `x` and `y` positions
- component-set wrapper positions or organizational bounds
- vector path coordinates, transform matrices, or internal icon geometry
- rotation and angles unless the project explicitly tokenizes them
- grid row or column counts
- prototype timing or interaction values
- implicit Figma defaults that are exposed on every node but are not actively used, such as opacity `1` or stroke weight on a layer with no visible stroke

Apply these dimension classifications before producing a raw-numeric warning:

1. If exactly one of `width` or `height` is bound to a valid variable, the other is a fixed numeric value, and the layer's aspect ratio is locked, treat the unbound dimension as derived from the bound dimension. Do not warn about it. If the rendered layer is non-square, emit the aspect-ratio information finding defined below; if it is square, emit no finding.
2. Otherwise, if an unbound fixed width belongs to a verified icon container, emit the icon-container information finding defined below instead of a warning for that width.
3. Apply the ordinary raw-numeric warning to dimensions that meet neither exception.

Do not suppress unrelated raw numeric properties on the same layer. A raw icon-container height, padding, gap, radius, or other property still follows the normal rules unless it independently qualifies for an exception.

For several occurrences of the same property and value, group the affected paths instead of repeating identical entries.

### Raw colors

Example summary:

`Warning: A color is not bound to a variable or style`

Inspect active colors in:

- solid and gradient fills
- text fills, including mixed text-range fills
- strokes
- effect colors

A color passes when it is directly bound to a valid color variable, inferred from a valid variable binding, or governed by a valid applied style.

Do not report image or video fills as colors. Inspect hidden layers, because they may become visible through a property or variant. Skip only paint or effect entries that are themselves disabled and cannot render.

If a style reference exists but is broken, report the missing-style error instead of this warning for the same property.

### Detached instances

Example summary:

`Warning: A detached instance no longer receives component updates`

Use this warning when Figma provides detached-instance information or otherwise proves that a selected descendant was detached. Do not infer detachment from visual similarity alone.

### Variable scope mismatch

Example summary:

`Warning: A variable is bound outside its current scope`

Use this warning when a binding still resolves but the variable's current type or scope no longer permits that property. Existing usage may still render, but the binding can no longer be applied there normally.

### Library availability

Example summary:

`Warning: A referenced asset belongs to a library that is not enabled for this file`

Use this warning when a component, style, or variable still resolves but its source library is not enabled for the file. If the source library or asset is genuinely inaccessible or missing, use the relevant error instead.

Only report an asset as coming from the wrong library when the user or project context explicitly defines the allowed libraries. Do not invent an allowlist.

### Pending library updates

Example summary:

`Warning: A referenced asset has a pending library update`

Use this warning only when Figma explicitly exposes a pending update affecting an asset within the selected roots. Do not infer pending updates from differing values alone.

### Incomplete inspection

Example summary:

`Warning: The audit could not verify every required reference`

Use this warning when permissions, library access, mixed values, or tool limitations prevent a required reference from being verified. State exactly what could not be checked. Do not convert an unverified reference into a missing-asset error.

## Information

Information findings describe allowed or expected implementation patterns. They do not count as problems and never affect whether the selection passes the audit. The summaries below are examples, not fixed report templates.

### Unbound icon-container width

Example summary:

`Info: An icon container uses an unbound width for optical spacing compensation`

Use this information finding instead of a raw-numeric warning when all of the following are true:

- the affected property is a non-zero fixed `width`
- the width is not bound to a variable
- the layer is explicitly named `Icon container` or has an equally clear semantic icon-container role
- the layer directly wraps or positions an icon
- there is no evidence that the value is a broken binding

Do not infer this role merely because an arbitrary frame contains a vector. Do not extend this exception to the icon container's height, padding, gap, corner radius, or other numeric properties.

### Derived dimension with locked aspect ratio

Example summary:

`Info: A non-square aspect-ratio-locked layer derives one dimension from the variable-bound dimension`

Use this information finding when exactly one of `width` or `height` is bound to a valid variable, the other is an unbound fixed numeric value, the aspect ratio is locked, and the rendered layer is non-square. Include which dimension is variable-bound, which is derived, both current dimensions, and the resulting ratio when useful.

Treat a layer as square when its rendered width and height are equal within normal Figma rounding. For a square layer that otherwise meets this rule, emit no warning and no information finding.

If the variable binding is broken, report the binding error instead. If the aspect ratio is not locked, or neither dimension is variable-bound, apply the normal raw-numeric rules. Do not report both this finding and the icon-container finding for the same dimension pair.

## Avoid false positives

- Do not infer historical causes. A raw value does not prove which variable or style was previously attached.
- Do not treat every override as invalid.
- Do not treat hidden or unpublished assets as missing when their references still resolve.
- Do not treat a removed library from the file as a broken asset when the reference still resolves; use the library-availability warning.
- Do not treat matching names as proof that two assets are the same.
- Do not treat zero as a missing numeric binding.
- Do not warn about a dimension derived through a locked aspect ratio from the other variable-bound dimension.
- Do not warn about a verified icon container's unbound width; classify it as information.
- Do not report the same property as both a broken style and a raw color.
- Do not report the same dimension under both information exceptions.
- Do not report an error solely from visual mismatch. Require structural or reference evidence.

## Output format

Return compact Markdown. Use a list for findings and do not use a table.

Write all generated report text in English. Preserve literal layer, component, style, variable, collection, and mode names exactly as they appear in Figma.

Use the fixed severity prefixes `Error:`, `Warning:`, and `Info:`. The summary after the prefix must describe the actual root cause. The phrases in this skill and the examples below are illustrative, not a closed set of allowed messages. Do not force a finding into an inaccurate stock phrase.

Sort findings in this order:

1. Errors
2. Warnings
3. Information

Use one item per root cause:

```md
- Error: A bound variable no longer exists — `Button / medium` › `Content` › `Label text` › font size; unresolved variable `Text Size / 1_125`.
- Error: An instance uses an unsupported component configuration and requires Reset to default — `Button / medium / disabled` › `Leading icon`; stored variant value `outline` is no longer supported.
- Warning: A numeric value is not bound to a variable — `Button / large` › `Content` › gap: `12`.
- Warning: A color is not bound to a variable or style — `Button / hover` › `Background` › fill: `#6D5EF7`.
- Info: An icon container uses an unbound width for optical spacing compensation — `Button / medium` › `Leading icon` › `Icon container` › width: `18`.
```

For each item, include:

- selected root or variant
- full layer path
- affected property
- current value, asset, or unresolved reference
- concise evidence when the reason is not self-evident

Group identical findings across same-type variants or selected roots. List the affected variant values or paths after the shared issue.

Do not add repair instructions unless the user asks for fixes. Mention `Reset to default` only when it is the confirmed action required to restore a valid component state.

If there are no errors or warnings and no information findings, return only:

```md
No problems found.
```

If there are no errors or warnings but there are information findings, return the passing result followed by the information list:

```md
No problems found.

- Info: A non-square aspect-ratio-locked layer derives its height from its variable-bound width — `Logo` › width: `24` via `Size / 1_500`; derived height: `16`.
```

Information findings are not conditions for passing the audit. If the audit is incomplete, never return `No problems found.`; return the incomplete-inspection warning instead.

## Quality bar

Before finishing, confirm that:

- every selected root and hidden descendant was inspected
- all direct and inferred variable references were resolved by ID
- alias chains and explicit modes were checked
- all style references were resolved
- all instances and instance-swap references were checked
- component-property references and variant values were validated
- raw numeric checks excluded structural geometry, implicit defaults, locked-aspect-ratio derived dimensions, and verified icon-container widths
- raw color checks included mixed text ranges and effect colors
- non-square locked-aspect-ratio exceptions were reported as information only
- information findings did not affect the passing result
- no Figma objects were modified
- every reported error is proven rather than inferred
- all generated report wording is in English
