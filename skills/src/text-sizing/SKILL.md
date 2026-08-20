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
