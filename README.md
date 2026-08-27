# Stylos Design System

A design system for dense, desktop-oriented web product interfaces. Its visual language draws on antiquity, classical architecture and constructed proportion — strict and structural rather than decorative.

**Pre-alpha. Private, owner-led. Not released.**

| | |
| --- | --- |
| Owner | Artur Trifonov |
| Figma | [Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles) · [Components](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components) · [GUI components](https://www.figma.com/design/vmR8eiLdeZQuEVXokZK57c/Stylos--GUI-components) · [Playground](https://www.figma.com/design/Fx2BP5qzqL9Gkas8JTFKz6/Stylos-Playground) — keys in [`figma/README.md`](figma/README.md) |
| Icons | [Default Kit / Material Icons](https://www.figma.com/design/mal5Fp20UXdswiLoBTVDvI/Default-Kit--Material-Icons) — external, interim |
| Repository | https://github.com/wrgraff/stylos |
| Design tool | Figma |
| Platform | web, desktop-oriented applications |
| Planned implementation | Svelte |
| License | undecided; unlicensed for external use until chosen |

## Start here

| | |
| --- | --- |
| [`docs/charter.md`](docs/charter.md) | what the system is for, its character, and where its boundaries are |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | how it is put together — what lives where, and what is currently broken |
| [`docs/foundations/`](docs/foundations/README.md) | the rules of the design language |
| [`PLAN.md`](PLAN.md) | the path to v0.1 |

## What is here

```text
docs/          charter, foundations, component standard and registry, specs
tokens/        the canonical token set, imported from Figma
skills/        Figma Agent skills — modular source, compiled to one importable document
tools/         small dependency-free scripts that build and check the above
figma/         what the Figma library contains; Figma itself stays the source of truth
```

Each directory has a `README.md` explaining what belongs in it.

## Figma and this repository

Figma holds the *values* — variables and styles — and `tokens/` imports them. It does **not** hold component contracts: those are authored here, and Figma is one implementation of them, checked against them ([`ARCHITECTURE.md`](ARCHITECTURE.md) §1).

The repository **never writes to Figma** — an explicit non-goal until a reliable round trip exists ([decision 0001](docs/decisions/0001-figma-connection-model.md)).

Variables move one way. An export is made by hand and read once:

```bash
npm run tokens:import -- ~/Downloads   # export → tokens/
npm run tokens:check                   # verify the record against itself
npm run tokens:report                  # render current values
```

The exported files are not kept — `tokens/*.yaml` is the record, and its history is in git.

## Working on it

```bash
npm install
npm test                  # tool tests
npm run build:skills      # skills/src/ → skills/dist/, imported into Figma Agent by hand
npm run validate:registry # component registry: contradictions fail, judgements are reported
npm run registry:view     # → build/registry.html, the readable index over the registry
npm run components:view   # → build/components/, one generated page per component
```
