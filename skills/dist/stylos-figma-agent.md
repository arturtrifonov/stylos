<!--
  GENERATED FILE. Do not edit directly.
  Source: skills/src/*/SKILL.md, compiled by tools/build-skills.mjs
  Order:  skills/targets/figma-agent.md
  To change this document, edit the sources and run `npm run build:skills`.
-->

# Stylos — Figma Agent Skills

Compiled skill document for manual import into Figma Agent. Contains:

- `stylos-component-integrity-check` v0.2
- `stylos-naming-cleanup` v0.7
- `stylos-text-sizing` v0.2
- `stylos-reference-reconstruction` v0.1

---

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

---

---
name: stylos-naming-cleanup
description: "Clean up naming in a selected Figma component or component set according to Stylos naming rules. Use when renaming component names, layers, component properties, variant properties, text properties, instance swap properties, variable names, property order, and controlled property group ordering for design-system consistency. Do not use for visual redesign, layout changes, or token value changes."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.7
---

# Stylos Naming Cleanup

Clean up naming in a selected Figma component, component set, or related library objects according to Stylos Design System naming rules.

This skill is for naming normalization only. It must not redesign components, change layout, change visual appearance, change token values, or restructure component APIs beyond naming unless the user explicitly asks for that.

## When to use

Use this skill when the user asks to:

- fix naming in a Figma component
- clean up layer names
- rename component properties
- rename boolean properties
- rename text properties
- rename instance swap properties
- normalize variant property names and values
- remove default Figma names such as `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1`, or `Variant 1`
- prepare a component for publishing into the Stylos Design System library

Do not use this skill when the task is mainly about:

- visual design
- spacing
- layout structure
- token values
- color decisions
- typography scale decisions
- component architecture redesign
- accessibility review
- content writing

If the selected object is not a component, component set, or clear component-related frame, ask the user what scope should be processed.

## Operating mode

Work in two stages unless the user explicitly asks to apply changes immediately:

1. Inspect the selected component or component set.
2. Produce a rename plan grouped by object type.
3. Apply renames only after confirmation, or apply immediately if the user explicitly requested direct cleanup.

If the agent can safely rename objects directly in Figma, rename only names and property labels. Do not change geometry, variants, visibility, constraints, auto layout, styles, variables, or component structure.

## Naming rules

### Components

Component names use Title Case with spaces between words.

Good:

- `Button`
- `Icon Button`
- `Text Field`
- `Search Field`
- `Date Picker`
- `Navigation Item`
- `Empty State`

Bad:

- `button`
- `icon button`
- `Icon button`
- `icon-button`
- `icon_button`
- `IconButton`

Use `/` only for library hierarchy.

Good:

- `Button / Primary`
- `Input / Text Field`
- `Navigation / Sidebar`
- `Overlay / Modal`
- `Data Display / Table`

Bad:

- `Button / Primary / Medium / Hover / With Icon`

If a difference can be represented as a variant or component property, prefer property naming over long slash hierarchy.

### Layers

Layer names use Sentence case.

Good:

- `Label text`
- `Helper text`
- `Leading icon`
- `Trailing icon`
- `Content`
- `Actions`
- `Background`
- `Divider`
- `Focus ring`

Bad:

- `Label Text`
- `helper text`
- `Text`
- `Frame 1`
- `Group 1`

Name layers by role, not appearance.

Good:

- `Background`
- `Focus ring`
- `Divider`
- `Content`

Bad:

- `Blue rectangle`
- `Grey line`
- `Big text`

Keep the same logical layer name across variants.

Good:

- `Label text`
- `Label text`
- `Label text`

Bad:

- `Label text`
- `Title`
- `Text`

### Text layers

Text layers must end with `text`.

Good:

- `Label text`
- `Heading text`
- `Description text`
- `Helper text`
- `Placeholder text`
- `Button text`
- `Empty state text`

Bad:

- `Text`
- `Label`
- `Heading`
- `Title`

### Variant properties

Variant property names use lowercase.

Good:

- `type`
- `tone`
- `style`
- `size`
- `state`
- `density`
- `validation`
- `is checked`
- `is filled`
- `is expanded`
- `orientation`
- `alignment`
- `position`

Bad:

- `Type`
- `Status`
- `Size`
- `State`
- `Check State`
- `checked`
- `isFilled`
- `isOpen`
- `Button Type`
- `Component State`

Variant values use lowercase.

Good:

- `primary`
- `secondary`
- `success`
- `extra small`
- `small`
- `medium`
- `large`
- `extra large`
- `default`
- `hover`
- `active`
- `disabled`
- `regular`
- `compact`

Bad:

- `Primary`
- `Secondary`
- `Static`
- `Hover`
- `Disabled`
- `xs`
- `s`
- `m`
- `l`
- `xl`

Use `default` instead of `static` when the property represents the base state in a state set.

### Size values

Use full readable size names for component variant values.

Good for component variants:

- `extra small`
- `small`
- `medium`
- `large`
- `extra large`

Bad for component variants:

- `xs`
- `s`
- `m`
- `l`
- `xl`

Short size aliases are allowed only for tokens, variables, and code export.

Good for tokens and variables:

- `size / xs`
- `size / s`
- `size / m`
- `size / l`
- `size / xl`

Use this exact order for component size values:

1. `extra small`
2. `small`
3. `medium`
4. `large`
5. `extra large`

Do not alphabetize size values.

Use `state` only for interaction states: `default`, `hover`, `active`, `focus`, `disabled`.

Do not use `status` as a variant property. It is too close to `state`. Use more specific names:

- `tone` for semantic visual meaning: `base`, `info`, `success`, `warning`, `error`, `inverted`
- `validation` for form validation outcome: `off`, `error`, `warning`, `success`
- `is checked` for checkbox/radio selection: `false`, `true`, `mixed`
- `is expanded` for disclosure state: `false`, `true`
- `is filled` for filled input state: `false`, `true`

### Text component properties

Text component properties must end with `text`.

Good:

- `label text`
- `heading text`
- `description text`
- `helper text`
- `placeholder text`
- `button text`

Bad:

- `Text`
- `Label`
- `Heading`
- `Title`

Use role, not actual content.

Good:

- `label text`
- `placeholder text`
- `button text`

Bad:

- `Delete project`
- `Enter name`
- `No results found`

### Boolean component properties

Boolean properties must read as true/false toggles.

Use only:

- `has [object]`
- `is [state]`

Use `has` for optional parts of component anatomy.

Good:

- `has icon`
- `has leading icon`
- `has trailing icon`
- `has helper text`
- `has description`
- `has divider`
- `has avatar`
- `has footer`
- `has badge`

Use `is` for component state, boolean-like state, and state-like variant properties.

Good:

- `is expanded`
- `is selected`
- `is active`
- `is loading`
- `is disabled`
- `is checked`
- `is invalid`
- `is read-only`

Bad:

- `icon`
- `helper`
- `expanded`
- `selected`
- `visible`
- `show icon`
- `show label`
- `show helper text`
- `on`
- `off`
- `yes`
- `no`

Do not use `show` for public component API.

Rare exception: `show` is allowed only for temporary documentation or prototype controls, such as:

- `show annotations`
- `show measurements`
- `show layout guides`

### Instance swap properties

Instance swap properties use role-based names.

Good:

- `icon`
- `leading icon`
- `trailing icon`
- `avatar`
- `badge`
- `prefix component`
- `suffix component`
- `empty state illustration`

Prefer `leading` and `trailing` over `left` and `right`.

Good:

- `leading icon`
- `trailing icon`

Bad:

- `left icon`
- `right icon`

Reason: `leading` and `trailing` are more resilient for RTL and localization.


## Property order

Property order is part of the public component API. Components should expose recurring properties in the same order whenever those properties exist.

The rule is strict for common properties. Rare component-specific properties may be placed at the end of the relevant group when a canonical position is not defined.

Figma already separates variant properties from component properties in the UI. This section defines the canonical order inside those groups.

### Canonical variant property order

Use this order for variant properties:

1. `type`
2. `tone`
3. `style`
4. `size`
5. `density`
6. `state`
7. `validation`
8. `is checked`
9. `is filled`
10. `is expanded`
11. `orientation`
12. `alignment`
13. `position`
14. `icon position`
15. `arrows`
16. `angle`
17. `first link type`
18. component-specific variant properties

Only include properties that exist in the component.

If `size` exists, its values must use this exact order:

1. `extra small`
2. `small`
3. `medium`
4. `large`
5. `extra large`

Good:

- `type`
- `size`
- `state`

Bad:

- `state`
- `size`
- `type`

### Meaning of common variant properties

Use `state` only for interaction state.

Good `state` values:

- `default`
- `hover`
- `active`
- `focus`
- `disabled`

Do not use `state` for semantic color, validation, checked state, or open/closed state.

Use `tone` for semantic visual meaning.

Good `tone` values:

- `base`
- `neutral`
- `primary`
- `info`
- `success`
- `warning`
- `error`
- `danger`
- `inverted`

Use `validation` for form validation outcome.

Good `validation` values:

- `off`
- `error`
- `warning`
- `success`

Use `is checked` for checkbox and radio selection state.

Do not use the bare property name `checked` in the public Figma component API. It is too easy to confuse with a value.

Good `is checked` values for binary controls:

- `false`
- `true`

Good `is checked` values for tri-state checkboxes:

- `false`
- `true`
- `mixed`

Use `mixed` for the indeterminate visual state. Avoid `indeterminate` in the property value unless the component explicitly needs product-facing wording.

Use `is expanded` for accordion, disclosure, or expandable header state.

Good `is expanded` values:

- `false`
- `true`

Use `is filled` for input filled/empty visual state.

Good `is filled` values:

- `false`
- `true`

Do not use:

- `Status`
- `Check State`
- `checked`
- `isOpen`
- `isFilled`
- `Static`

### Controlled property group rule

If a boolean property controls the presence of an element, all properties related to that element must be placed immediately after the boolean.

The boolean and its related properties form one controlled property group. Do not split this group with unrelated properties.

Use this rule for all `has` properties that expose a configurable slot, text, content block, nested element, or action.

Good:

- `has leading icon`
- `leading icon`
- `has trailing icon`
- `trailing icon`

Good when the controlled element has several settings:

- `has leading icon`
- `leading icon`
- `leading icon tone`
- `leading icon size`

Bad:

- `has leading icon`
- `has trailing icon`
- `leading icon`
- `trailing icon`

#### Order inside a controlled property group

Use this order inside the group:

1. `has [element]`
2. `[element]` instance swap or slot
3. `[element] text`
4. `[element] type`
5. `[element] tone`
6. `[element] size`
7. `[element] position`
8. rare element-specific settings

Examples:

- `has close button`
- `close button icon`
- `close button label text`
- `close button type`

- `has additional text`
- `additional text`
- `additional text tone`

### Canonical non-variant property order

Use this order for component properties after variant properties.

Each controlled property group should stay together.

1. `has leading icon`
2. `leading icon`
3. `has icon`
4. `icon`
5. `has trailing icon`
6. `trailing icon`
7. `has avatar`
8. `avatar`
9. `has badge`
10. `badge`
11. `has status indicator`
12. `status indicator`
13. `has label`
14. `label text`
15. `has heading`
16. `heading text`
17. `has title`
18. `title text`
19. `has description`
20. `description text`
21. `placeholder text`
22. `input text`
23. `helper text`
24. `has additional text`
25. `additional text`
26. `number text`
27. `has content`
28. `content`
29. `has active page`
30. `active page text`
31. `is required`
32. `has close button`
33. `has primary button`
34. `has secondary button`
35. `has tertiary button`
36. `has buttons`
37. `has undo button`
38. `has overflow`
39. `has item 1`
40. `has item 2`
41. `has item 3`
42. `has item 4`
43. `has item 5`
44. `has page 2`
45. `has page 3`
46. `has page 4`
47. `has page 5`
48. `has page 6`
49. rare component-specific properties

Only include properties that exist in the component.

### Slot and icon controlled groups

Use these common controlled groups:

- `has leading icon` → `leading icon`
- `has icon` → `icon`
- `has trailing icon` → `trailing icon`
- `has avatar` → `avatar`
- `has badge` → `badge`
- `has status indicator` → `status indicator`
- `has close button` → `close button`
- `has primary button` → `primary button`
- `has secondary button` → `secondary button`
- `has tertiary button` → `tertiary button`
- `has overflow` → `overflow`

Prefer `leading` and `trailing` over `left` and `right`.

Good:

- `has leading icon`
- `leading icon`
- `has trailing icon`
- `trailing icon`

Bad:

- `has left icon`
- `left icon`
- `has right icon`
- `right icon`

### Text and content controlled groups

Use these common controlled groups:

- `has label` → `label text`
- `has heading` → `heading text`
- `has title` → `title text`
- `has description` → `description text`
- `has additional text` → `additional text`
- `has content` → `content`
- `has active page` → `active page text`

If the text always exists, use the text property without a controlling `has` property.

Good:

- `label text`

Good when optional:

- `has label`
- `label text`

Bad:

- `label text`
- `has label`

### Action and section toggles

Use `has` for optional actions and sections.

Common properties:

- `has close button`
- `has primary button`
- `has secondary button`
- `has tertiary button`
- `has buttons`
- `has undo button`
- `has overflow`
- `has item 1`
- `has item 2`
- `has item 3`
- `has item 4`
- `has item 5`
- `has page 2`
- `has page 3`
- `has page 4`
- `has page 5`
- `has page 6`

Avoid `show` in all public property names.

Good:

- `has close button`
- `has primary button`
- `has overflow`

Bad:

- `Show Close Button`
- `Show Primary Button`
- `Show Overflow`

### Fallback for rare properties

If a property is not listed in the canonical order:

1. keep it inside the correct top-level group
2. place it after known properties in that group
3. order several rare properties by component anatomy or user-facing importance
4. if anatomy does not help, order alphabetically

Do not create a global position for a property that appears only once or twice unless it becomes reused across the system.

### Variables

Variables use slash-separated lowercase hierarchy.

Pattern:

- `category / role / property / state`

Good:

- `color / text / primary`
- `color / text / secondary`
- `color / surface / base`
- `color / surface / raised`
- `color / border / default`
- `color / border / focus`
- `space / 4`
- `space / 8`
- `space / 12`
- `radius / small`
- `radius / medium`
- `radius / large`
- `size / icon / small`
- `size / icon / medium`
- `size / icon / large`

Do not put mode names into variable names.

Good:

- `color / text / primary`

Bad:

- `color / text / primary light`
- `color / text / primary dark`

Light and Dark should be handled through variable modes.

## Rename workflow

### Step 1: Identify scope

Inspect the current selection.

Determine whether the selection is:

- a single component
- a component set
- an instance
- a component-related frame
- a documentation frame
- a mixed selection

If an instance is selected, do not rename the instance as if it were the main component unless the user explicitly wants instance cleanup. Prefer asking whether to process the source component or only the selected instance.

### Step 2: Inventory names

Collect names for:

- selected component or component set
- all variant properties
- all variant values
- all component properties
- all text properties
- all boolean properties
- all instance swap properties
- all direct and nested layers
- all local variables used by the selected component, if available

### Step 3: Detect violations

Flag these as errors:

- default Figma names: `Frame 1`, `Group 1`, `Rectangle 1`, `Vector 1`, `Text`, `Component 1`, `Variant 1`
- unnamed or generic layers
- component names not in Title Case
- layer names not in Sentence case
- text layers not ending in `text`
- text properties not ending in `text`
- boolean properties not starting with `has` or `is`
- boolean properties starting with `show`
- `left` / `right` used for icon slots
- variant property names using Title Case
- variant values using Title Case
- component size variant values using short aliases: `xs`, `s`, `m`, `l`, `xl`
- component size variant values not ordered as `extra small`, `small`, `medium`, `large`, `extra large`
- `Static` used as a state value
- `Status` used as a variant property
- `Check State` used as a variant property
- bare `checked` used as a variant property; use `is checked`
- `isOpen` or `isFilled` used instead of spaced lowercase names
- recurring properties placed in non-canonical order
- controlled property groups split by unrelated properties
- variables not using slash-separated lowercase hierarchy

Flag these as warnings:

- `Wrapper`
- `Container`
- `Content`
- `Group`
- `Shape`
- `Icon wrapper`
- very long names
- names based on visual appearance
- component names with too many slash levels
- state-like values encoded in component names

Warnings should not block cleanup, but include them in the report.

### Step 4: Create rename plan

Return a grouped rename plan before applying changes unless the user explicitly requested immediate cleanup.

Format:

```md
## Rename plan

### Component
- `Old name` → `New name`

### Variant properties
- `Type` → `type`
- `Size` → `size`
- `State` → `state`
- `Check State` → `is checked`

### Variant values
- `Primary` → `primary`
- `Secondary` → `secondary`
- `XS` → `extra small`
- `S` → `small`
- `M` → `medium`
- `L` → `large`
- `XL` → `extra large`
- `Static` → `default`

### Component properties
- `Text` → `label text`
- `Show Left Icon` → `has leading icon`
- `Left Icon` → `leading icon`
- `Show Right Icon` → `has trailing icon`
- `Right Icon` → `trailing icon`

### Layers
- `Text` → `Label text`
- `Frame 1` → `Content`
- `Rectangle 1` → `Background`
```

### Step 5: Apply safe renames

Apply only name changes.

Do not change:

- layer hierarchy
- auto layout
- constraints
- component variants
- visibility
- styles
- variables bindings
- color values
- typography values
- spacing values
- effects
- prototype connections

If applying a rename could break a public API or existing instances, mention the risk before applying.

### Step 6: Verify after renaming

After applying changes, inspect the result and report:

- number of renamed components
- number of renamed layers
- number of renamed component properties
- number of renamed variant properties
- number of renamed variant values
- unresolved warnings
- any items that require human decision

## Common mappings

Use these mappings unless context clearly suggests otherwise.

### Component properties

- `Text` → `label text`
- `Title` → `title text`
- `Heading` → `heading text`
- `Description` → `description text`
- `Helper` → `helper text`
- `Placeholder` → `placeholder text`
- `Number Text` → `number text`
- `Active Page Text` → `active page text`
- `Input Text` → `input text`
- `Additional Text` → `additional text`

### Boolean properties

- `Show Icon` → `has icon`
- `Show Left Icon` → `has leading icon`
- `Show Right Icon` → `has trailing icon`
- `Show Label` → `has label`
- `Show Helper Text` → `has helper text`
- `Show Additional Text` → `has additional text`
- `Show Required` → `is required`
- `Show Status` → `has status indicator`
- `Show Badge` → `has badge`
- `Show Heading` → `has heading`
- `Show Content` → `has content`
- `Show Close Button` → `has close button`
- `Show Buttons` → `has buttons`
- `Show Primary Button` → `has primary button`
- `Show Secondary Button` → `has secondary button`
- `Show Tertiary Button` → `has tertiary button`
- `Show Undo Button` → `has undo button`
- `Show Overflow` → `has overflow`
- `Show Active Page` → `has active page`
- `Show Item 1` → `has item 1`
- `Show Item 2` → `has item 2`
- `Show Item 3` → `has item 3`
- `Show Item 4` → `has item 4`
- `Show Item 5` → `has item 5`
- `Show Page 2` → `has page 2`
- `Show Page 3` → `has page 3`
- `Show Page 4` → `has page 4`
- `Show Page 5` → `has page 5`
- `Show Page 6` → `has page 6`
- `Expanded` → `is expanded`
- `Selected` → `is selected`
- `Loading` → `is loading`
- `Disabled` → `is disabled`
- `Checked` → `is checked`
- `Invalid` → `is invalid`

### Instance swap properties

- `Left Icon` → `leading icon`
- `Right Icon` → `trailing icon`
- `Icon Left` → `leading icon`
- `Icon Right` → `trailing icon`
- `Leading Icon` → `leading icon`
- `Trailing Icon` → `trailing icon`

### Variant properties

- `Type` → `type`
- `Status` → `tone`
- `Size` → `size`
- `State` → `state`
- `Check State` → `is checked`
- `checked` → `is checked`
- `isFilled` → `is filled`
- `isOpen` → `is expanded`
- `Validation` → `validation`
- `Density` → `density`
- `Mode` → `mode` only if it is not a Figma variable mode
- `Alignment` → `alignment`
- `Align` → `alignment`
- `Orientation` → `orientation`
- `Dropdown Icon Position` → `icon position`
- `Angle` → `angle`
- `Arrows` → `arrows`
- `First Link Type` → `first link type`

### Variant values

- `Primary` → `primary`
- `Secondary` → `secondary`
- `Tertiary` → `tertiary`
- `Info` → `info`
- `Success` → `success`
- `Warning` → `warning`
- `Danger` → `danger`
- `Error` → `error`
- `Base` → `base`
- `Neutral` → `neutral`
- `Inverted` → `inverted`
- `Off` → `off`
- `True` → `true`
- `False` → `false`
- `Checked` → `true`
- `Unchecked` → `false`
- `Indeterminate` → `mixed`
- `Left` → `leading`
- `Right` → `trailing`
- `XS` → `extra small`
- `S` → `small`
- `M` → `medium`
- `L` → `large`
- `XL` → `extra large`
- `xs` → `extra small`
- `s` → `small`
- `m` → `medium`
- `l` → `large`
- `xl` → `extra large`
- `Static` → `default`
- `Default` → `default`
- `Hover` → `hover`
- `Active` → `active`
- `Disabled` → `disabled`
- `Regular` → `regular`
- `Compact` → `compact`

## Ambiguity rules

If a name is ambiguous, prefer the least destructive option.

Ask the user before renaming when:

- a generic layer can map to several roles
- `Text` could be `label text`, `heading text`, or `description text`
- `Frame 1` could be `Content`, `Header`, `Footer`, `Actions`, or another structural role
- a property looks like a public API used across many existing instances
- a component name suggests a larger architecture issue

Do not invent overly specific names without visual or structural evidence.

## Output format

When reporting back to the user, use a compact summary.

Example:

```md
Done.

Renamed:
- 1 component
- 8 component properties
- 14 layers
- 6 variant values

Still needs review:
- `Content` may be too generic
- `Container` kept because it appears to be a technical wrapper
```

If not applying changes yet, return only the rename plan and ask for confirmation.

## Quality bar

The final component should meet these conditions:

- no default Figma names remain
- component name uses Title Case
- layer names use Sentence case
- text layers end with `text`
- text properties end with `text`
- boolean properties use `has` or `is`
- no public boolean property uses `show`
- instance swap icon properties use `leading` / `trailing`
- variant property names use lowercase
- variant values use lowercase
- component size values use full readable names: `extra small`, `small`, `medium`, `large`, `extra large`
- component size values follow the canonical order: `extra small`, `small`, `medium`, `large`, `extra large`
- `default` is used instead of `static` for the base state
- recurring properties follow canonical property order
- controlled properties are placed immediately after their `has` boolean
- `state` is used only for interaction states
- `checked` is not used as a public component property name; use `is checked`
- `tone` is used instead of `status` for semantic visual meaning
- `validation`, `is checked`, `is filled`, and `is expanded` are used instead of overloaded state/status names
- variable names use slash-separated lowercase hierarchy when variables are in scope

---

---
name: stylos-text-sizing
description: "Apply Stylos Text Size and matching String or Text Line Height variable bindings to the primary text role in a selected Figma component or component set. Use when updating typography across size variants in Figma. Resolve an explicitly provided component mapping first; otherwise use confirmed Element or Object defaults. Do not change component naming, secondary text, or unrelated typography."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.2
---

# Stylos Text Sizing

Apply matching font-size and line-height variables to the primary text role in the selected Figma component or component set.

## When to use

Use this skill when the user asks to:

- set text sizes and line heights in a component
- bind typography to Stylos variables
- update typography across `size` variants
- apply the default Element or Object text-size profile
- apply a custom text-size mapping to a specific component

Do not use this skill for:

- component, property, variant, or layer naming cleanup
- typography scale design
- font family, weight, style, letter spacing, alignment, or text-case changes
- color, spacing, effects, layout, or component structure
- updating every text layer in a component

## Operating mode

Work on the current Figma selection.

If the user asks to change, apply, set, or update sizing, apply the bindings directly. Do not require a separate confirmation when the scope, mapping, and primary text role are unambiguous.

If the selection is:

- a component set: process its relevant variants
- a single main component: process that component
- an instance: ask whether to update the source component or only the selected instance
- not a component, component set, or clear component-related frame: ask the user to define the scope

## Scope

Change only:

- font-size variable binding
- line-height variable binding

Change these bindings only on the component's primary text role.

Do not change:

- secondary or supporting text unless it is the component's primary content
- raw text content
- font family, weight, style, or letter spacing
- text case, alignment, or resizing behavior
- layer names
- component, variant, or property names
- variant values
- component structure, layout, or nested-instance structure
- colors, spacing, effects, or other variables

## Resolve the size mapping

Treat level profiles as defaults, not universal rules.

Use this priority:

1. Use a mapping explicitly provided in the current request.
2. Use a component-specific mapping explicitly defined in its documentation or established project context.
3. If no component override exists, use the default profile for the component's confirmed architectural level.

A component-specific mapping always takes priority over the level default.

Do not treat the component's current bindings as an intentional custom mapping unless the user or component documentation identifies them as such. The current bindings may be the values that need correction.

Require one exact measure for every size included in the task. Do not calculate missing measures, choose the nearest measure, or silently combine a partial custom mapping with a default profile.

If the task targets all five sizes and the custom mapping is incomplete, ask for the missing values.

### Confirm the component level

Treat the level as confirmed only when it is:

- stated by the user
- encoded explicitly in the component's library hierarchy, page, section, metadata, or documentation

Do not infer `Element` or `Object` from visual complexity alone.

If the level is unknown and the user did not provide a complete component-specific mapping, ask for the level or mapping.

Do not infer defaults for architectural levels other than `Element` and `Object`. Their profiles are not defined yet.

## Canonical size values

The real `size` variant values used in Stylos components are:

- `extra small`
- `small`
- `medium`
- `large`
- `extra large`

Use these full values when matching Figma variants.

Do not rename the `size` property or its values as part of this skill.

### Request shorthand

The user may describe the same five sizes in abbreviated form:

- `XS` → `extra small`
- `S` → `small`
- `M` → `medium`
- `L` → `large`
- `XL` → `extra large`

Treat these abbreviations only as shorthand in the request. They are not the real Figma variant values.

The user may also provide an unlabeled list of exactly five measures. Interpret it in this fixed order:

1. `extra small`
2. `small`
3. `medium`
4. `large`
5. `extra large`

For example:

`0_750, 0_875, 1_125, 1_250, 1_500`

means:

- `extra small` → `0_750`
- `small` → `0_875`
- `medium` → `1_125`
- `large` → `1_250`
- `extra large` → `1_500`

If an unlabeled list does not contain exactly five measures or its intended order is unclear, ask the user.

## Default profiles

### Element

| Size | Measure |
| --- | --- |
| `extra small` | `0_750` |
| `small` | `0_875` |
| `medium` | `1_125` |
| `large` | `1_250` |
| `extra large` | `1_500` |

### Object

| Size | Measure |
| --- | --- |
| `extra small` | `0_875` |
| `small` | `1_125` |
| `medium` | `1_375` |
| `large` | `1_625` |
| `extra large` | `1_875` |

## Bind matching variables

For each processed size, bind:

- font size to `Text Size / [measure]`
- line height to either `String Line Height / [measure]` or `Text Line Height / [measure]`

Font size and line height must use the same measure.

Good:

- `Text Size / 0_875`
- `String Line Height / 0_875`

Good:

- `Text Size / 1_375`
- `Text Line Height / 1_375`

Bad:

- `Text Size / 0_875`
- `String Line Height / 1_125`

If an exact variable is unavailable, stop for that size and report it. Do not use a raw value, calculate a substitute, or choose the nearest measure.

## Identify the primary text role

Do not update every text layer.

Use this priority:

1. Prefer the text layer connected to the component's primary public text property.
2. Prefer a layer whose semantic role matches the component, such as `Label text` in `Label`, `Button text` in `Button`, or `Heading text` in `Heading`.
3. Prefer the equivalent text layer repeated consistently across all variants.
4. Use component anatomy and placement only as supporting evidence.

Treat helper, description, caption, shortcut, counter, status, and other supporting text as secondary unless the component itself represents that role.

Do not select a layer only because it is the first text layer in the hierarchy.

If several text layers are equally plausible primary targets, ask the user to choose. Do not change all candidates.

## Choose the line-height family

Use one line-height family for the primary text role across the component set.

Apply this priority:

1. Preserve an existing valid binding to `String Line Height` or `Text Line Height`.
2. Infer the family from the component or primary text role name.
3. Infer it from intended text behavior and resizing settings.

Use `String Line Height` for text intended to remain on one line.

Typical signals:

- component or primary role named `Label`
- label, button, tab, menu item, badge, value, or similar control text
- auto-width or hug-content behavior
- no intended wrapping

Use `Text Line Height` for text intended to wrap across lines.

Typical signals:

- component or primary role named `Text`
- body, paragraph, description, message, or similar prose
- fixed-width or fill-container text with auto height
- intended wrapping

Current sample content occupying one line is not enough to classify the component as a string. Prefer intended behavior.

If the existing binding, naming, and resizing behavior conflict, ask the user which family to use.

## Apply bindings

1. Inspect the selected component or component set.
2. Identify the `size` variant property and match its full canonical values.
3. Resolve the component-specific mapping or confirm the architectural level.
4. Identify one primary text role and its equivalent layer in every relevant variant.
5. Choose `String Line Height` or `Text Line Height`.
6. Bind font size and line height using the same resolved measure.
7. Apply the same mapping to every non-size variant that shares the processed size.

If processing a single component or variant without a `size` property, use a size only when it is unambiguous from the request, component, or variant name. Otherwise ask the user.

Do not detach nested instances or override unrelated nested text.

If the primary text is supplied by a nested `Label` or `Text` component and its typography cannot be changed safely through exposed properties, report the blocker.

## Verify

After applying changes, confirm that:

- the mapping source is explicit: request override, documented component override, `Element` default, or `Object` default
- every processed full `size` value uses its resolved `Text Size` variable
- font size and line height use the same measure
- the selected line-height family is consistent for the primary text role
- no raw font-size or line-height value remains on the primary text role
- secondary text layers were not modified
- naming, other typography, and component properties remain unchanged

Report:

- mapping source
- applied size-to-measure mapping
- line-height family
- processed sizes
- skipped variants
- missing variables
- unresolved ambiguities

---

---
name: stylos-reference-reconstruction
description: "Rebuild a Figma interface from a screenshot, image, mockup, wireframe, or external design reference using the active Stylos Design System. Use when the user asks to recreate, adapt, translate, or rebuild a reference UI in Figma. Preserve the reference's information architecture, content, interaction intent, hierarchy, current state, and layout relationships, but map every component and visual decision to existing Stylos components, properties, variants, styles, and variables. Do not reproduce the reference pixel-for-pixel, copy its visual language, or alter Stylos components to match it."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.1
---

# Stylos Reference Reconstruction

Rebuild the referenced interface as if it had originally been designed with Stylos.

Translate the reference. Do not trace it.

## Contents

- [Core rule](#core-rule)
- [Sources of truth](#sources-of-truth)
- [Workflow](#workflow)
- [Semantic mapping rules](#semantic-mapping-rules)
- [Component rules](#component-rules)
- [Dimension rules](#dimension-rules)
- [Typography rules](#typography-rules)
- [Color rules](#color-rules)
- [Layout and spacing rules](#layout-and-spacing-rules)
- [Icon and asset rules](#icon-and-asset-rules)
- [States and behavior](#states-and-behavior)
- [Missing or ambiguous mappings](#missing-or-ambiguous-mappings)
- [Prohibited shortcuts](#prohibited-shortcuts)
- [Verification](#verification)
- [Output format](#output-format)

## Core rule

Transfer roles, relationships, and behavior from the reference. Never transfer raw visual parameters when Stylos already defines them.

Interpret every source property semantically:

- `primary action`, not `blue button`
- `muted helper text`, not `12 px gray text`
- `selected navigation item`, not `item with a purple background`
- `compact icon action`, not `10 px square control`
- `raised content group`, not `card with a 16 px radius and shadow`

Use the Stylos representation of the inferred role even when it differs visibly from the reference. A visible difference caused by correct system usage is intentional, not a reconstruction error.

Apply this principle to all properties, including components, color, typography, size, spacing, radius, border, effects, iconography, states, and responsive behavior.

## Sources of truth

Follow this precedence:

1. Explicit user instructions
2. Stylos component APIs and behavior
3. Stylos semantic styles, variables, and layout rules
4. The reference's product logic and information hierarchy
5. Approximate visual resemblance

Use the reference as the source of truth for:

- content and data shown
- user intent and available actions
- information architecture
- order, grouping, and relationships
- relative emphasis
- interaction type
- current state
- broad layout composition

Use Stylos as the source of truth for:

- component choice and anatomy
- component behavior and property API
- component sizes
- color roles and values
- typography roles and values
- spacing and sizing scales
- icons
- borders, radii, and effects
- state representation
- resizing and responsive behavior

Never let the reference override a design-system decision merely to make the result look closer.

## Workflow

### 1. Read the reference semantically

Before creating layers, identify:

- the screen or flow purpose
- major regions and their hierarchy
- repeated patterns
- controls and their intended behavior
- current states and selections
- content roles
- semantic emphasis
- layout relationships
- any product-specific content that must remain

Do not start by sampling colors, measuring every pixel, or drawing matching rectangles.

### 2. Inspect available Stylos assets

Find the relevant:

- components and component sets
- variants and exposed component properties
- instance swap options
- semantic variables
- text styles
- effect styles
- icons
- layout patterns

Prefer published Stylos assets already available to the file. Do not recreate an asset locally because the reference looks slightly different.

### 3. Create a semantic mapping

For each meaningful source element, determine:

1. its product role
2. its interaction model
3. the closest Stylos component or pattern
4. the required variant, state, tone, size, and exposed properties
5. the relevant content and layout behavior

Resolve mappings before fine layout work. When useful, use this internal structure:

| Source element | Inferred role | Stylos asset | Configuration | Intentional difference |
| --- | --- | --- | --- | --- |
| Bright call-to-action | Primary action | Button | Primary type, appropriate size | Uses Stylos primary color and dimensions |

### 4. Build with system assets

Use instances, variables, styles, auto layout, and exposed properties. Preserve the reference's logic while allowing the system to determine its appearance.

If the user asked for direct reconstruction, proceed without waiting for approval. Ask only when ambiguity would materially change the product behavior, data, or component family.

### 5. Verify against intent and system rules

Compare the result with the reference at two levels:

- Does it preserve the same product logic, hierarchy, content, and relationships?
- Does it use Stylos without visual imitation, detached components, or unauthorized overrides?

Do not evaluate success by pixel similarity.

## Semantic mapping rules

Choose the target by function before appearance.

Examples:

| Reference | Incorrect reconstruction | Correct reconstruction |
| --- | --- | --- |
| Orange primary button | Copy the orange fill | Use the Stylos primary Button configuration |
| 10 px icon action | Scale an Icon Button to 10 px | Use the smallest supported Stylos size |
| 18 px semibold heading | Recreate the font parameters | Use the corresponding Stylos heading style |
| 300 px text input | Rebuild the input at the exact source height | Use Text Field and adjust only an allowed external width |
| Highly rounded card | Copy the radius and shadow | Use the Stylos container pattern and its system effects |
| Red status label | Copy the red value | Use the matching Stylos semantic tone |

Preserve a source distinction only when it communicates a real distinction in meaning, hierarchy, state, or behavior. Discard decorative differences that have no Stylos equivalent.

## Component rules

Choose components by interaction model and semantic role, not by silhouette.

- Use existing Stylos components whenever a valid match exists.
- Keep library components as instances.
- Configure instances through exposed variants, text properties, booleans, and instance swaps.
- Prefer a component's semantic property such as `type`, `tone`, `state`, or `size` over direct visual overrides.
- Preserve the component's anatomy, internal padding, gaps, alignment, icon treatment, and behavior.
- Preserve nested component instances and their APIs.
- Use the closest supported state rather than inventing a new visual state.
- Compose existing components when no single component covers the pattern.
- Use a minimal auto-layout structure with Stylos variables only when composition cannot express the required layout.

Do not:

- detach an instance
- scale an instance
- edit a main component to fit one reconstruction
- rebuild an available component from primitive layers
- add or remove internal parts outside the exposed API
- override internal padding, gaps, radii, strokes, effects, icon sizes, or typography
- create a near-duplicate local component
- create or modify design-system variables, styles, components, or variants unless explicitly requested

## Dimension rules

Apply these rules separately to width and height. A component may allow external control on one axis while keeping the other axis intrinsic.

Use this decision order for each axis:

1. **Exposed size control:** If the relevant dimension is governed by a `size` property or another explicit component property, change only that property. Do not resize the instance or replace the governed value manually.
2. **Variable-bound dimension:** If the dimension is bound to a variable, keep the binding. When the component supports another existing size variable, switch to that variable instead of entering a raw value.
3. **Externally resizable fixed dimension:** If the dimension is fixed, not variable-bound, and intentionally represents available layout space, adjust it to fit the reconstructed layout.
4. **Intrinsic dimension:** Otherwise, preserve the component's dimension and resizing behavior.

Examples of usually adjustable external dimensions:

- text field width
- search field width
- panel width
- card or content-container width
- dialog width when the pattern allows it

Examples of usually intrinsic dimensions:

- control height
- icon button width and height
- icon size
- checkbox or radio indicator size
- internal action size
- padding and gaps inside a component

Additional rules:

- A Text Field with a default unbound width of 220 may be set to 120 or 300 when width is an externally resizable layout dimension.
- An internal Button dimension bound to a size variable must keep that binding or use another supported size variable; do not replace it with a raw value.
- A component dimension governed by a `size` property must be changed through that property only.
- Apply the decision per axis. A `size` property may govern control height while an explicitly resizable width still follows its own layout behavior.
- Preserve `Hug contents` unless the component or layout pattern explicitly supports `Fill container`.
- Use `Fill container` only for an axis intended to respond to parent layout.
- Preserve min/max constraints when present.
- Preserve aspect ratio for assets that require it.
- Never distort or scale a component to reach a source measurement.
- Do not force the reference's 10 px element when the smallest supported Stylos size is 12 px. Use the supported size.
- A fixed unbound value is not automatically editable. Change it only when it represents external layout capacity rather than component anatomy.

## Typography rules

Map text by role and hierarchy.

Infer roles such as:

- page heading
- section heading
- body text
- label
- supporting text
- caption
- data value
- code

Apply the corresponding Stylos text style. Do not preserve or manually reproduce the source's:

- font family
- font size
- weight
- line height
- letter spacing
- stylistic casing

Preserve actual capitalization only when it belongs to the content, such as names, acronyms, codes, or user-entered data.

Do not create local text styles or manual typography overrides to improve visual similarity. If text no longer fits, adjust an allowed container dimension, wrapping, truncation, or layout before considering another valid Stylos text role.

## Color rules

Infer the semantic role of every source color, then use the corresponding Stylos semantic color.

Map roles such as:

- primary and secondary actions
- base, raised, or overlay surfaces
- primary, secondary, or disabled foregrounds
- borders and dividers
- focus
- selection
- information, success, warning, and error
- destructive actions

Use component variants or semantic variables to apply these roles. When a component exposes `type`, `tone`, `state`, or another semantic property, use that property instead of recoloring the instance.

Do not:

- sample or copy source hex, RGB, HSL, opacity, gradient, or shadow values
- preserve a source hue because it is visually prominent
- map by color similarity
- bind a primitive color merely because it resembles the source
- create a new color variable for the reconstruction
- recolor nested component layers outside the component API

For example, if the reference uses purple for primary actions and Stylos uses another primary color, use the Stylos primary role.

Treat a logo, illustration, photograph, or user-generated image as content. Its own colors may remain inside the asset, but they must not define the reconstructed interface palette.

## Layout and spacing rules

Preserve structural relationships rather than measurements.

Carry over:

- region order
- grouping
- alignment intent
- repeated structure
- relative prominence
- broad density
- columns and major proportions when meaningful
- overlay and containment relationships

Rebuild them with:

- auto layout
- Stylos spacing variables
- system container patterns
- appropriate `Hug contents`, `Fill container`, and fixed resizing behavior

Do not copy raw padding, gap, margin, radius, border width, or shadow measurements from the reference. Use the closest system-supported values and patterns.

The requested viewport or frame size may match the target context. Components inside it must still follow Stylos rules. Allow text metrics and component dimensions to change wrapping, density, or exact alignment when required by the system.

Avoid absolute positioning except where the interaction pattern genuinely requires an overlay, anchored decoration, or similar behavior.

## Icon and asset rules

Map icons by function.

- Use the closest Stylos icon for the intended action or object.
- Use instance swap properties when exposed.
- Keep the icon size, stroke, optical treatment, and color defined by the component or icon system.
- Keep product-specific logos, illustrations, and images only when they are meaningful content and available as assets.
- Use a neutral placeholder when meaningful content imagery is unavailable.

Do not trace source icons, draw stylistic substitutes, resize nested icons manually, or crop pieces of the screenshot into the interface.

Never use the screenshot itself as part of the reconstructed UI. If it must remain for comparison, place it in a separate, clearly labeled, locked reference frame outside the final interface.

## States and behavior

Infer behavior from the control's purpose, labels, surrounding content, and state—not only from its appearance.

- Map the source interaction to the closest Stylos interaction pattern.
- Represent selected, expanded, checked, loading, validation, disabled, and other states through existing component properties or variants.
- Preserve the component's native behavior even when the source component behaves or looks differently.
- Preserve logical action priority even if Stylos represents that priority with different visuals.
- Do not simulate an unsupported state with manual colors, opacity, or layer visibility.

If the reference conflicts with Stylos behavior, keep the product intent and implement it through the closest supported Stylos pattern. Record the deviation.

## Missing or ambiguous mappings

When no exact component exists, use this order:

1. an existing component with the same behavior
2. a composition of existing Stylos components
3. a minimal system-native structure using existing variables and styles
4. a documented design-system gap

Do not use raw source parameters as a fallback.

Ask the user only when the ambiguity could materially change:

- the user task
- the data or content
- the interaction model
- the component family
- an important responsive behavior

For minor ambiguity, choose the most plausible semantic mapping and report the assumption afterward.

If an essential role has no supported component, variable, or style, do not silently invent one. Use the safest existing pattern when possible and list the gap.

## Prohibited shortcuts

Never:

- optimize for pixel-perfect similarity
- sample visual values from the reference
- trace the screenshot
- use the screenshot as a background or flattened final UI
- detach or scale component instances
- override component internals to force a match
- replace system typography with source typography
- reproduce the source brand language through local styles
- create local near-duplicates of system assets
- weaken system consistency to preserve decorative details

## Verification

Before finishing, confirm that:

- the reconstructed screen preserves the reference's task, content, hierarchy, and relationships
- every source element was interpreted by role rather than copied by appearance
- all available UI patterns use Stylos component instances
- no instance was detached or scaled
- component variants and exposed properties control type, tone, size, and state
- component dimensions follow the per-axis decision order
- no component anatomy or internal spacing was changed
- typography uses Stylos text styles without manual source-style overrides
- interface colors use Stylos semantic roles rather than sampled values
- spacing, radius, borders, and effects follow Stylos
- icons come from the Stylos icon system where available
- unsupported mappings and material assumptions are documented
- the screenshot is not part of the final UI

## Output format

After building, return a compact report:

```md
Reconstructed using Stylos.

Mapped:
- [major source role] -> [Stylos component or pattern]

Intentional differences:
- [difference caused by Stylos behavior or tokens]

Needs review:
- [material assumption or unsupported pattern]
```

Omit empty sections. Do not list routine pixel differences or every component instance.
