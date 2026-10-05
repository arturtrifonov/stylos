# Typography in Figma

Global typography rules live in [Typography](../docs/foundations/typography.md). This document describes the variable and style representation in Figma.

## Variables and text styles

Figma uses one single-mode `font` collection with the groups `family`, `size`, `line height`, `weight`, `letter spacing` and `paragraph spacing`. Font sizes use `font/size/[measure]`; line heights use `font/line height/[family]/[measure]`.

The text styles combine these variables under `text/*`, `label/*`, `heading/*` and `code/*`. Their current record is [text-styles.yaml](text-styles.yaml), which stores token references and the style-specific case and width metadata.

`tools/import-styles.mjs` writes that record from a Plugin API read because the Variables export does not contain Styles. Import and frontend projection are implementation details, documented in [the frontend package](../packages/ui/README.md#typography-exports).

## Display width

The recorded heading styles currently set Georama's width axis to 110. Whether to keep that expanded width is the open design question in [Typography](../docs/foundations/typography.md#open).

If the decision removes the expansion, update the Figma heading styles and read them again with `tools/import-styles.mjs`. If it keeps the expansion, the frontend also needs a compatible font asset and face declaration; its current gap is recorded in [heading width](../packages/ui/README.md#heading-width).
