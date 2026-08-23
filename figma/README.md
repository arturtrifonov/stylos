# figma/

Documentation of the Figma library structure. **Figma holds the values — variables and styles — and this directory never becomes a second copy of them.** Component contracts are not held here; they are authored in [`docs/components/registry/`](../docs/components/registry/README.md), and the Figma library is one implementation of them ([`ARCHITECTURE.md`](../ARCHITECTURE.md) §1). See also [decision 0001](../docs/decisions/0001-figma-connection-model.md).

## Library structure

Four Stylos files, plus one external library:

| File | Key | Contents |
| --- | --- | --- |
| [Stylos / Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles) | `2OJYDoTE9EAdQKaJAJK9Kt` | variables and styles — the foundations everything else consumes |
| [Stylos / Components](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components) | `WUc07ZBtjRvypXtsOlbVut` | component and component-set definitions |
| [Stylos / GUI components](https://www.figma.com/design/vmR8eiLdeZQuEVXokZK57c/Stylos--GUI-components) | `vmR8eiLdeZQuEVXokZK57c` | supporting assets that aren't product components — cursors and similar |
| [Stylos Playground](https://www.figma.com/design/Fx2BP5qzqL9Gkas8JTFKz6/Stylos-Playground) | `Fx2BP5qzqL9Gkas8JTFKz6` | scratch file for testing how components actually behave. Not a source of anything |
| [Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons) | `mal5Fp20UXdswiLoBTVDvI` | **external** — the icon source, used as an interim measure. See [icons.md](../docs/foundations/icons.md) |

The keys are the segment of each URL after `/design/`. They are what the Figma REST API addresses a file by, and the reason they are written down: without them nothing can ask Figma what it contains.

**The Playground is not documentation and not a library.** It exists to try things; nothing in this repository should ever cite it as evidence of how a component works.

## Where the variables went

Variable exports are **not stored here**. `npm run tokens:import` reads an export once and writes the canonical set to [`tokens/`](../tokens/README.md); the exported files themselves are never committed.

They used to be, as dated snapshot directories. That was withdrawn: because collections are imported one at a time, the directory was a composite of exports made on different days — a state that never existed in Figma at any single moment — and the checks anchored to it were verifying the token contract against a stale fabrication. The canonical set verifies against itself instead (`ref` and `values` are deliberately redundant), so nothing raw needs keeping.

Past exports remain in git history up to commit `80a0b51`, if one is ever wanted.

## What does not belong here

- Anything hand-edited that claims to represent current Figma state.
- Raw variable exports. They are input to `tokens:import`, not an artifact.
