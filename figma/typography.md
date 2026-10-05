# Typography in Figma

Global typography rules live in [Typography](../docs/foundations/typography.md). This document describes the variable and style representation in Figma.

## Variables and text styles

Figma uses one single-mode `font` collection with the groups `family`, `size`, `line height`, `weight`, `letter spacing` and `paragraph spacing`. Font sizes use `font/size/[measure]`; line heights use `font/line height/[family]/[measure]`.

The text styles combine these variables under `text/*`, `label/*`, `heading/*` and `code/*`. Their current record is [text-styles.yaml](text-styles.yaml), which stores token references and the style-specific case and width metadata.

`tools/import-styles.mjs` writes that record from a Plugin API read because the Variables export does not contain Styles. Import and frontend projection are implementation details, documented in [the frontend package](../packages/ui/README.md#typography-exports).

## Heading width

Author heading styles at the typeface's normal width, following FND-TYPOGRAPHY-09. The older [style record](text-styles.yaml) contains heading width metadata from its dated read; it records what was observed then, rather than the current contract. The frontend projection disregards that historical width metadata for heading styles.
