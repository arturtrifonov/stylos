# Icons in the Figma implementation

The public icon contract is [docs/foundations/icons.md](../docs/foundations/icons.md). This document covers Figma authoring and the recorded work to align its library with the current preset.

## Choosing and sizing an icon

Use the component's exposed instance-swap property, such as `icon`, `leading icon` or `trailing icon`, to apply FND-ICONS-02. Do not replace the mark by editing a nested layer.

Apply FND-ICONS-03 through the component's supported size properties. Do not manually resize a nested icon or trace a replacement from a screenshot. The current preset uses one optical drawing across the system's icon sizes; its parameters remain in the [preset description](../docs/foundations/icons.md#current-default-preset--material-symbols-rounded).

## Library structure

The Figma implementation has a settled plan for a dedicated icon file containing only the Material Symbols Rounded preset shipped by the repository. It will supply the same drawings as the committed SVGs, which are authoritative under FND-ICONS-12. Creating the file and aligning existing components remain the recorded implementation work. The file key belongs in [figma/README.md](README.md#library-structure) once it exists.

Consumers choosing another preset are responsible for the corresponding Figma library as well as its other integrations.

## Recorded alignment work

The existing alignment notes identify thirty icon components at [node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469), using the earlier external Material Icons library. The migration brings them into agreement with the committed preset.

The recorded appearance changes are **Success, Warning and Error**: the earlier drawings are outlined, while the current preset uses filled drawings. These notes describe the migration scope; inspect the file to establish its present state.

## Unchosen instances

Figma may show a placeholder for an icon instance that has not been chosen. It is an authoring aid, not a mark in the published preset. It does not become a frontend fallback; unresolved icon names follow FND-ICONS-13.
