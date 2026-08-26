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
