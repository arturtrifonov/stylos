# figma/

Documentation of the Figma library structure, and versioned native snapshots of Figma Variables. Figma itself remains the source of truth for everything live — this directory never becomes a second editable copy of it. See [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md) for the full reasoning.

## Library structure

Stylos currently spans **three linked Figma files**:

| File | Contents |
| --- | --- |
| Components | Component and component-set definitions (e.g. Button, Icon Button, Text Field) |
| Styles | Variables, styles, and other shared foundations consumed by Components |
| GUI Helpers | Supporting assets that aren't product components — cursors and similar helper elements |

Icons currently come from an external Material Symbols library, used as an interim source rather than a fourth Stylos-owned file — see [docs/foundations/icons.md](../docs/foundations/icons.md).

Fill in actual file links here once they're recorded in the [project passport](../docs/master-document.md#2-project-passport) (`Figma link` is currently "To be added").

## `variables/`

Contains [`exports/`](variables/exports/README.md) — dated, immutable native Figma Variables snapshots — plus notes on how they were produced and how to read them.

## What does not belong here

- Anything hand-edited that claims to represent current Figma state. If it isn't a native export, it isn't a snapshot.
- Tokens Studio exports, unless explicitly labeled as such and clearly marked non-authoritative (master doc [§8.4](../docs/master-document.md#84-tokens-studio)).
