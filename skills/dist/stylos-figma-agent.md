<!--
  GENERATED FILE. Do not edit directly.
  Source: skills/src/*/SKILL.md, compiled by tools/build-skills.mjs
  Order:  skills/targets/figma-agent.md
  To change this document, edit the sources and run `npm run build:skills`.
-->

# Stylos — Figma Agent Skills

Compiled skill document for manual import into Figma Agent. Contains:

- `stylos-component-integrity-check` v0.3
- `stylos-naming-cleanup` v0.9
- `stylos-reference-reconstruction` v0.2

---

---
name: stylos-component-integrity-check
description: "Audit selected Figma components, component sets, instances, or several same-type components for broken variable, style, and component references; stale instance states; detached instances; invalid variable modes and component properties; raw numeric or color values; and allowed exceptional sizing patterns. Use after variables, styles, components, or libraries have been updated, or when bindings and parameters may have become disconnected. Report errors, warnings, and non-blocking information only; do not modify the selection."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.3
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
- Error: A bound variable no longer exists — `Button Basic` › `size=medium` › `Content` › `Label text` › font size; unresolved variable `font/size/1_125`.
- Error: An instance uses an unsupported component configuration and requires Reset to default — `Button Basic` › `size=medium, state=disabled` › `Leading icon`; stored variant value `outline` is no longer supported.
- Warning: A numeric value is not bound to a variable — `Button Basic` › `size=large` › `Content` › gap: `12`.
- Warning: A color is not bound to a variable or style — `Button Basic` › `state=hover` › `Background` › fill: `#6D5EF7`.
- Info: An icon container uses an unbound width for optical spacing compensation — `Button Basic` › `size=medium` › `Leading icon` › `Icon container` › width: `18`.
```

Separate every level of the path with `›`. Do not use `/` as a separator: in a component name a slash means an Assets-panel group, and a report that also uses it for hierarchy makes the two indistinguishable. Write a variant as Figma names it — `size=medium, state=hover`.

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

- Info: A non-square aspect-ratio-locked layer derives its height from its variable-bound width — `Logo` › width: `24` via `size/s-3_000`; derived height: `16`.
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
  version: 0.9
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

**Apply directly. Do not ask for confirmation first.**

1. Inspect the selected component or component set.
2. Apply the renames.
3. Report the result, including what was left alone and what the API could not do.

A rename is reversible and Figma keeps undo, so a confirmation step buys nothing here: a plan listing forty renames gets approved without being read, which is worse than no gate because it looks like review. Produce a plan first only when the user asks for one.

Stop and ask only where §Ambiguity rules already says to — where a name could map to several roles and a human has to choose. Ask about those specific names; do not turn one ambiguity into a confirmation prompt for the whole run.

Rename only names and property labels. Do not change geometry, variants, visibility, constraints, auto layout, styles, variables, or component structure.

## Vocabulary — for mapping, not for judging

**This section exists so a name can be mapped to the right one. It is not a list to audit a component against.**

Which values a component offers is a design decision, made when the component was designed. Whether `secondary` belongs on a particular `tone` is not a naming defect and is not this skill's question. Walking a component's values and asking which are "allowed" turns a rename into an architecture review and produces a page of questions instead of a cleanup.

Apply a mapping when a known-wrong word appears. Do not sweep for conformance, do not report a value as missing, and do not ask whether a value is legitimate.

| Property | What it carries |
| --- | --- |
| `type` | the component's own kinds |
| `tone` | a colour role the system has — see below |
| `style` | the component's own visual treatments |
| `size` | `extra small`, `small`, `medium`, `large`, `extra large`, in that order |
| `state` | `default`, `hover`, `active`, `focus`, `disabled` |
| `validation` | `off`, `error`, `warning`, `success` |
| `is checked` | `false`, `true`, `mixed` |
| `is filled`, `is expanded` | `false`, `true` |
| `orientation`, `alignment`, `position`, `icon position` | the component's own |

**`tone` names a colour role, and the system has three kinds of them:** the semantic slots (`base`, `primary`, `success`, `warning`, `danger`), the neutral hierarchy (`secondary`, `tertiary`, `inverted`), and any palette hue by name (`slate`, `amber`, `violet`, and the rest). A component built for categorical colour — an indicator dot, a tag — legitimately exposes the whole palette. That is normal and nothing flags it.

Only two words are wrong as a tone, and both have a mapping: `error` is a validation outcome and becomes `danger`; `info` names no colour the system has, so it needs a decision rather than a rename.

**`tone` names a colour; `state` and `validation` name a condition.** They map many-to-one: an input in the error state takes the `danger` colour.

**Do not use `status` as a variant property.** It is too close to `state`. Whatever it was carrying belongs to `tone`, `validation`, or one of the booleans.

**Size values are never abbreviated in a component.** `xs`…`xl` are conversational shorthand only. They are not how tokens are named either — the scale is `s-1_000`…`s-7_000`, a ratio to the base of 8.

**Do not use `state` for colour, validation, checked state, or open/closed state.** Each of those has its own property.

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

Use `/` only to group components in the Assets panel, and only when **the last segment is a name that stands on its own**. Figma names an instance after the last segment and discards the rest of the path.

Good:

- `Tabs / Tab Item` — an instance reads `Tab Item`
- `Table / TD Text` — an instance reads `TD Text`

Bad:

- `Button / Base` — an instance reads `Base`, which means nothing in a layer tree. Use `Button Base`.
- `Button / Primary / Medium / Hover / With Icon` — properties, not a path.

Related components that cannot share a path share a **prefix** instead: `Button Base`, `Button Hollow`, `Button Ghost`.

A slash group is a category, never a claim about containment. A component used inside another is still top-level: `Tab Item` is not filed under `Tabs`.

Never prefix a component with `_` or otherwise mark it as internal. Components used inside others are published and public; where one is normally used inside another, that belongs in its Figma description, not in its name.

If a difference can be represented as a variant or component property, prefer property naming over a slash hierarchy.

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

Variant values use lowercase, with spaces between words.

Bad:

- `Primary`
- `Static`
- `Hover`
- `xs`, `s`, `m`, `l`, `xl`

Which values a property may take is in [Vocabulary](#vocabulary). Do not judge a value without knowing its property: `error` is correct on `validation` and wrong on `tone`.

Use `default` instead of `static` when the property represents the base state in a state set.

### Size values

Full words, per [Vocabulary](#vocabulary). Their order is fixed and is not alphabetical:

1. `extra small`
2. `small`
3. `medium`
4. `large`
5. `extra large`

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

**The principle: a property that changes the meaning of what is below it comes first.** Changing `type` changes which tones make sense; changing `tone` does not change which sizes exist; changing `state` changes nothing below it. Arrangement comes last because nothing depends on it. A property not listed below finds its place by asking what it would invalidate.

| Band | Properties |
| --- | --- |
| what it is | `type` |
| what it means | `tone` |
| how it is rendered | `style` |
| how big | `size` |
| what is happening to it | `state`, `validation` |
| its internal condition | `is checked`, `is filled`, `is expanded` |
| how it is arranged | `orientation`, `alignment`, `position`, `icon position` |
| its own | `arrows`, `angle`, `first link type`, anything component-specific |

Read top to bottom, left to right, for the full order.

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

### Step 4: Apply the renames

Apply directly. A plan is produced first only when the user asked for one; the format is then the same as the report below, with `will be` in place of `was`.

Pass each rename down as a **finished pair** — this layer, this new name. Never delegate the intent ("tidy the names"), because the rules in this skill are not visible further down: an instruction that names both ends has nothing else it could do, and one that names a goal does.

Apply only name changes. Do not change layer hierarchy, auto layout, constraints, variants, visibility, styles, variable bindings, colour, typography, spacing, effects, or prototype connections.

Renames do not break anything outside the library file: nothing reaches another file until the library is published. Inside the file, instances of a renamed component update with it. Do not warn about breakage — there is none to warn about at this stage. This changes when the library is published, and this paragraph is what to revisit then.

### Step 5: Report the result

Report the component **as it now stands**, not as a list of edits. The question being answered is "is this right now", which is a state; a diff answers "what did you touch", which is a different and less useful question.

Show closed properties in full, including values that were already correct — a missing `focus` in a state set is visible in a complete list and invisible in a diff. Mark what changed with `was`, and list the properties in canonical order so a wrong order is visible without a line saying so.

```md
## Button — after cleanup

**Variant properties**
type · tone · size · state

**size**
  extra small          was `XS`
  small                was `S`
  medium               was `M`
  large                was `L`
  extra large          was `XL`

**state**
  default              was `Static`
  hover
  active
  focus
  disabled

**Component properties**
  label text           was `Text`
  has leading icon     was `Show Left Icon`
  leading icon         was `Left Icon`

**Layers** — 14 renamed, 6 already correct
  Label text           was `Text`
  Content              was `Frame 1`
  Background           was `Rectangle 1`

**Left alone**
  `Container` — a technical wrapper; not a role name, but not wrong either
  `Text 2` — could be `helper text` or `description text`; needs a decision
```

**"Left alone" is not optional.** Counting what was renamed hides what was not, and a skipped name is exactly the failure a report exists to surface.

`→` in a report means "was renamed to" and nothing else. It never means "comes before".

### Step 6: Hand back what the API cannot do

The Plugin API cannot reorder properties without breaking instance bindings, so property order is always a manual fix. Anything else the API refuses goes in the same section.

This is an instruction for a person working in the Figma properties panel, which is a vertical list. Write it as a vertical list:

```md
## Needs your hand — the Plugin API cannot reorder properties

**Pagination — component properties.** Drag into this order:

1. has active page
2. active page text
3. has overflow
4. has page 2
5. has page 3
6. has page 4
7. has page 5
8. has page 6

Two things are out of place: `active page text` is last, though it belongs
directly under the boolean that controls it; and the pages run backwards.
```

- **Enumerate every entry.** No `…`, no ranges — an ellipsis cannot be dragged.
- **Number the lines**, so a place in the list can be kept while working.
- **State what is wrong once, in prose, after the list.** Not as a second chain of arrows.
- **Say why it is manual** in the heading, so it does not read as the skill having failed.

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
- `Mode` → `mode` only if it is not a Figma variable mode
- `Alignment` → `alignment`
- `Align` → `alignment`
- `Orientation` → `orientation`
- `Dropdown Icon Position` → `icon position`
- `Angle` → `angle`
- `Arrows` → `arrows`
- `First Link Type` → `first link type`

### Variant values, by property

A value cannot be mapped without knowing its property. `Error` is a correct `validation` value and is not a tone at all, so the same word maps differently depending on where it sits.

**`tone`** — after `Status` → `tone`:

- `Error` → `danger`
- `Info`, `Neutral` → not tone values; ask which of the vocabulary applies
- `Base`, `Primary`, `Success`, `Warning`, `Danger`, `Inverted` → lowercase

**`state`**

- `Static` → `default`
- `Default`, `Hover`, `Active`, `Focus`, `Disabled` → lowercase

**`validation`**

- `Off`, `Error`, `Warning`, `Success` → lowercase. `error` stays `error` here.

**`is checked`**

- `Checked` → `true`
- `Unchecked` → `false`
- `Indeterminate` → `mixed`

**`is filled`, `is expanded`**

- `True` → `true`, `False` → `false`

**`size`**

- `XS` / `xs` → `extra small`
- `S` / `s` → `small`
- `M` / `m` → `medium`
- `L` / `l` → `large`
- `XL` / `xl` → `extra large`

**`icon position`, `alignment`, `position`**

- `Left` → `leading`, `Right` → `trailing`

**Open properties** — `type`, `style`, and the rest: lowercase with spaces, nothing else. Their values belong to the component and are not mapped to a system list.

## Ambiguity rules

If a name is ambiguous, prefer the least destructive option.

Ask the user before renaming when:

- a generic layer can map to several roles
- `Text` could be `label text`, `heading text`, or `description text`
- `Frame 1` could be `Content`, `Header`, `Footer`, `Actions`, or another structural role
- a property looks like a public API used across many existing instances
- a component name suggests a larger architecture issue

Do not invent overly specific names without visual or structural evidence.

### When two layers want the same name

Only a genuinely uniform list produces a real collision — five list items, six page links. Number those: `Item 1`, `Item 2`.

Otherwise a collision means the name is not specific enough. If `Label text` fits two layers, they are two different labels and each needs the name that says which: `Label text` and `Helper text`, not `Label text` and `Label text 2`. Look for the more precise name rather than resolving the conflict.

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
- variant property names and values use lowercase
- `size` values are full words in their fixed order
- `default` is used instead of `static` for the base state
- recurring properties follow canonical property order, or the report says they could not be reordered
- controlled properties are placed immediately after their `has` boolean
- variable names use slash-separated lowercase hierarchy when variables are in scope

And of the report itself:

- it shows the component's resulting state, not a list of edits
- closed properties are shown in full, including values that did not change
- everything left alone is listed, with the reason
- anything the API could not do is handed over as a numbered list, not a chain of arrows

---

---
name: stylos-reference-reconstruction
description: "Rebuild a Figma interface from a screenshot, image, mockup, wireframe, or external design reference using the active Stylos Design System. Use when the user asks to recreate, adapt, translate, or rebuild a reference UI in Figma. Preserve the reference's information architecture, content, interaction intent, hierarchy, current state, and layout relationships, but map every component and visual decision to existing Stylos components, properties, variants, styles, and variables. Do not reproduce the reference pixel-for-pixel, copy its visual language, or alter Stylos components to match it."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.2
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

**Produce this mapping before building anything, and print it.** It is not a private planning aid: it is the instruction the build step works from, and the only thing a delegated executor will know about the library. An executor that receives a description of the task rather than a mapping has no way to learn that a component exposes `has checkbox`, and will build the shape out of primitives instead.

Name real assets and real property values, as they exist in the library — not categories:

| Source element | Inferred role | Stylos asset | Configuration | Intentional difference |
| --- | --- | --- | --- | --- |
| Bright call-to-action | Primary action | `Button Basic` | `tone=primary`, `size=medium`, `button text` set | Stylos primary colour and dimensions |
| Row with a tick box | Selectable tree row | `Tree Item` | `has checkbox=true`, `icon` swapped for the field-type icon | — |

A row whose **Stylos asset** column is empty is not a mapping. Search the library for that role before building; if nothing matches, it belongs in the gap list, not in an improvised shape.

### 4. Build with system assets

Build from the mapping. Nothing is built that has no row in it.

Use instances, variables, styles, auto layout, and exposed properties. Preserve the reference's logic while allowing the system to determine its appearance.

**Delegate the mapping, never the task.** Where the work is passed to another agent or tool, pass the resolved rows — this component, these property values — and not the goal. Everything in this skill is invisible to whatever executes the change; a rule that only the planner has read cannot constrain a build it does not perform.

Printing the mapping is not a request for approval. If the user asked for direct reconstruction, print it and proceed. Ask only when ambiguity would materially change the product behavior, data, or component family.

### 5. Verify against intent and system rules

Count first, judge second. Before assessing anything, establish:

- how many component instances were placed
- how many of them are detached
- how many layers were drawn from primitives rather than instantiated
- which Stylos components were used, by name

A reconstruction with instances and no primitives is verifiable at a glance; "preserved the hierarchy" is an opinion. If primitives were drawn where a component exists, that is a defect regardless of how the result looks.

Then compare with the reference at two levels:

- Does it preserve the same product logic, hierarchy, content, and relationships?
- Does it use Stylos without visual imitation, detached components, or unauthorized overrides?

Do not evaluate success by pixel similarity.

## Semantic mapping rules

Choose the target by function before appearance.

Examples:

| Reference | Incorrect reconstruction | Correct reconstruction |
| --- | --- | --- |
| Orange primary button | Copy the orange fill | Use the Button component with `tone=primary` |
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

Report these counts, then confirm the rest:

- instances placed, instances detached, layers drawn from primitives
- Stylos components used, by name
- rows in the mapping that were not built, and why

Then confirm that:

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

After building, return a compact report. **Do not repeat the mapping** — it was printed before the build. Report what departed from it.

```md
Reconstructed using Stylos.

Built: 55 instances, 0 detached, 0 layers drawn from primitives.
Components used: Tree Item, Button Basic, Window Header, Scrollbar.

Departed from the mapping:
- Group header — planned `Tree Item` with `is expandable=true`; the property is not
  exposed on this variant, so the disclosure icon is an instance swap instead.

Intentional differences from the reference:
- [difference caused by Stylos behaviour or tokens]

Needs review:
- [material assumption, or a role with no supported component]
```

The counts come first because they are the only part of the report that can be checked without opening the file. A report that says what it built and not what it departed from is a summary of intentions, not of results.

Omit empty sections, except the counts, which are always reported. Do not list routine pixel differences or every component instance.
