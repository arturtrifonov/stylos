# figma/

Documentation of the Figma library structure. **Figma is the source of truth for everything visual, and this directory never becomes a second copy of it.** See [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md).

## Library structure

Stylos currently spans **three linked Figma files**:

| File | Contents |
| --- | --- |
| Components | Component and component-set definitions (e.g. Button, Icon Button, Text Field) |
| Styles | Variables, styles, and other shared foundations consumed by Components |
| GUI Helpers | Supporting assets that aren't product components — cursors and similar helper elements |

Icons currently come from an external Material Symbols library, used as an interim source rather than a fourth Stylos-owned file — see [docs/foundations/icons.md](../docs/foundations/icons.md).

## Where the variables went

Variable exports are **not stored here**. `npm run tokens:import` reads an export once and writes the canonical set to [`tokens/`](../tokens/README.md); the exported files themselves are never committed.

They used to be, as dated snapshot directories. That was withdrawn: because collections are imported one at a time, the directory was a composite of exports made on different days — a state that never existed in Figma at any single moment — and the checks anchored to it were verifying the token contract against a stale fabrication. The canonical set verifies against itself instead (`ref` and `values` are deliberately redundant), so nothing raw needs keeping.

Past exports remain in git history up to commit `80a0b51`, if one is ever wanted.

## What does not belong here

- Anything hand-edited that claims to represent current Figma state.
- Raw variable exports. They are input to `tokens:import`, not an artifact.
- Tokens Studio exports, unless explicitly labeled as such and clearly marked non-authoritative (master doc [§8.4](../docs/master-document.md#84-tokens-studio)).
