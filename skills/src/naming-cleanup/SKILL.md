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
