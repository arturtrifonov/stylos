# figma/

Documentation and authoring conventions for the Figma implementation. **Figma holds the values — variables and styles — and this directory never becomes a second copy of them.** Component contracts are not held here; they are authored in [`docs/components/registry/`](../docs/components/registry/README.md), and the Figma library is one implementation of them ([`ARCHITECTURE.md`](../ARCHITECTURE.md) §1). See also decision 0001.

## Implementation conventions

- [Naming](naming.md): Assets grouping, slash paths, nested-component publishing, layer names and the properties panel.
- [Foundations](foundations.md): color and effect collections, import mapping, gradients and meshes.
- [Typography](typography.md): font variables, text-style records and the display width question.
- [Sizing](sizing.md): contract-supported adjustments, scale constraints and hidden-layer inspection.
- [Icons](icons.md): instance swaps, sizing, library structure and the recorded preset alignment.
- [Component readiness](components.md): Figma representation, authoring checks and implementation inspection.
- [MCP and connectors](mcp-and-connectors.md): access to the implementation and tool limitations.

These conventions apply to Figma. Public API and design-language rules stay in `docs/`; a tool constraint does not become a rule for the whole system.

## Stylos Tokens plugin

The owner-facing color transfer plugin is documented in
[`apps/figma-tokens/README.md`](../apps/figma-tokens/README.md). It maps collections
and modes explicitly, previews changes and updates variables in place while
preserving aliases and opacity. The Colors editor downloads standard DTCG mode files for native import. Its
advanced plugin transfer and the server endpoint use a separate protocol; the
editor also accepts the plugin's return palette draft. Both carry reassigned roles; the
plugin writes them once role rebinding is allowed. Repository token records still come
through the existing Figma export/import pipeline, except the authored special scale.

## Library structure

Four Stylos files, plus one external library:

| File | Key | Contents |
| --- | --- | --- |
| [Stylos / Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles) | `2OJYDoTE9EAdQKaJAJK9Kt` | variables and styles — the foundations everything else consumes |
| [Stylos / Components](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components) | `WUc07ZBtjRvypXtsOlbVut` | component and component-set definitions |
| [Stylos / GUI components](https://www.figma.com/design/vmR8eiLdeZQuEVXokZK57c/Stylos--GUI-components) | `vmR8eiLdeZQuEVXokZK57c` | supporting assets that aren't product components — cursors and similar |
| [Stylos Playground](https://www.figma.com/design/Fx2BP5qzqL9Gkas8JTFKz6/Stylos-Playground) | `Fx2BP5qzqL9Gkas8JTFKz6` | scratch file for testing how components actually behave. Not a source of anything |
| [Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons) | `mal5Fp20UXdswiLoBTVDvI` | **external** — the currently unaligned Figma icon library. The repository's default preset is documented in [icons.md](../docs/foundations/icons.md) |

The keys are the segment of each URL after `/design/`. They are what the Figma REST API addresses a file by, and the reason they are written down: without them nothing can ask Figma what it contains.

The planned dedicated icon file and its preset scope are described in [Icons](icons.md#library-structure). Its key will be added to the table once the file exists.

**The Playground is not documentation and not a library.** It exists to try things; nothing in this repository should ever cite it as evidence of how a component works.

## What version the library is

**Owner decision, 2026-11-03: the Figma version marker is retired.** Figma is no
longer where tokens are authored, and its `meta/version` variable stopped being
kept. A release's version lives in `package.json`, its git tag and
`CHANGELOG.md` ([`ARCHITECTURE.md`](../ARCHITECTURE.md) §9); `tokens:check` no
longer compares a Figma record with it, `tokens:import` no longer reads a `meta`
collection, and `figma/library.yaml` is gone. A library publish names its
release in the publish description, copied from the release notes.

Until then the published library stated its version in a `meta` collection in
*Stylos / Styles* — one hidden `STRING` variable, imported into
`figma/library.yaml` and checked against `package.json`. Its last record said
`0.1.0`, from 2026-09-05; it is in git history.

## Where the variables went

Variable exports are **not stored here**. `npm run tokens:import` reads an export once and writes the canonical set to [`tokens/`](../tokens/README.md); the exported files themselves are never committed.

They used to be, as dated snapshot directories. That was withdrawn: because collections are imported one at a time, the directory was a composite of exports made on different days — a state that never existed in Figma at any single moment — and the checks anchored to it were verifying the token contract against a stale fabrication. The canonical set verifies against itself instead (`ref` and `values` are deliberately redundant), so nothing raw needs keeping.

Past exports remain in git history up to commit `80a0b51`, if one is ever wanted.

## What does not belong here

- Anything hand-edited that claims to represent current Figma state.
- Raw variable exports. They are input to `tokens:import`, not an artifact.
