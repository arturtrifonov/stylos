# Foundations in the Figma implementation

The system rules remain in [Color](../docs/foundations/color.md) and [Borders, radii, and effects](../docs/foundations/effects.md). This document describes how the Figma library represents those foundations.

## Color collections

Figma uses two primitive collections, `palette.light` and `palette.dark`, each without modes, and the semantic `color` collection with light and dark modes. A semantic role can select a different palette step in each mode, following FND-COLOR-05.

The import combines the primitive collections into `palette` with `light` and `dark` modes in `tokens/`. The mapping is declared in [`tokens/_naming.yaml`](../tokens/_naming.yaml). A reference such as `palette/indigo/700` resolves against the ramp selected by the semantic role's mode; collection storage does not change the role's meaning.

## Effect collections

Figma represents `radius`, `border` and `effect` as three collections, each with one mode. Their token names and the shadow composition belong to the [effects foundation](../docs/foundations/effects.md), not to this tool convention.

The six shadow styles are not exported from Figma. `npm run tokens:css` composes them from the imported parameters; the pipeline is documented in [tools/README.md](../tools/README.md#the-token-pipeline).

## Gradients and meshes

Apply the image-content exception in FND-COLOR-03 to gradient stops and mesh colours. An editable Figma gradient or mesh can keep its own colours; applying this exception does not require rasterizing or replacing it with an image fill. Existing variable and style references still need to resolve.
