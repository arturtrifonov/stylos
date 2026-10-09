# Typography in Figma

Global typography rules live in [Typography](../docs/foundations/typography.md). This document describes the variable and style representation in Figma.

## Variables and text styles

Figma uses one single-mode `font` collection with the groups `family`, `size`, `line height`, `weight`, `letter spacing` and `paragraph spacing`. Font sizes use `font/size/[measure]`; line heights use `font/line height/[family]/[measure]`.

The text styles combine these variables under `text/*`, `label/*`, `heading/*` and `code/*`. Their current record is [text-styles.yaml](text-styles.yaml), which stores token references and the style-specific case and width metadata.

`tools/import-styles.mjs` writes that record from a Plugin API read because the Variables export does not contain Styles. Import and frontend projection are implementation details, documented in [the frontend package](../packages/ui/README.md#typography-exports).

FND-TYPOGRAPHY-10 defines when to apply complete styles and when a component implementation can use font variables directly. Style selection for HTML and Markdown content is documented in the [frontend package](../packages/ui/README.md#content-typography).

## Heading width

Author heading styles at the typeface's normal width, following FND-TYPOGRAPHY-09. The older [style record](text-styles.yaml) contains heading width metadata from its dated read; it records what was observed then, rather than the current contract. The frontend projection disregards that historical width metadata for heading styles.

## Document spacing reference

The owner approved option B on 2026-10-09. Its editable reference remains on the Typography page in [Stylos — Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles?node-id=2777-42), labelled `B / Approved hierarchy`. Options A and C remain labelled as unselected comparisons.

FND-TYPOGRAPHY-11 defines the heading-gap profile, FND-TYPOGRAPHY-12 defines adjacent gaps and document boundaries, and FND-TYPOGRAPHY-13 preserves the selected body's paragraph spacing. The reference applies existing text styles and binds outside heading gaps to existing `dimension/gap` variables. Native paragraph spacing is shown separately for all five base body sizes. Heading spacing belongs to document layout, rather than a change to the shared heading text styles.
