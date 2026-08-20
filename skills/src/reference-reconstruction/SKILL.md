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
