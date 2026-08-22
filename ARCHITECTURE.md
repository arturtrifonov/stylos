# Stylos — Architecture

How the system is put together: what lives where, which source is authoritative for what, how artifacts are produced, and where the chain currently breaks.

**This document is normative.** It describes the system as it actually is on the date below — not as it is intended to become. Anything that does not exist is listed as not existing. Intent, rationale, and history belong in [`docs/decisions/`](docs/decisions/README.md); rules of the design language belong in [`docs/foundations/`](docs/foundations/README.md).

**Status:** Alpha · private, owner-led · last verified 22 August 2026

---

## 1. Sources of truth

Every domain has exactly one authoritative source. When two places disagree, the source below wins and the other is corrected.

| Domain | Source of truth | Location | How it changes |
| --- | --- | --- | --- |
| Variables, styles | Figma | Figma cloud | by hand in the file |
| Components, variants, states | Figma | Figma cloud | by hand, or via skills through Figma Agent |
| Component levels, roles, relations | YAML registry | `docs/components/registry/` | by hand, validated by `npm run validate:registry` |
| Foundation rules | Markdown | `docs/foundations/` | by hand |
| Architectural decisions | Markdown | `docs/decisions/` | by hand, one record per material change |
| Skill behaviour | Markdown sources | `skills/src/` | by hand, compiled to `skills/dist/` |
| System structure | this document | `ARCHITECTURE.md` | by hand |
| Token snapshots | *derived* | `figma/variables/exports/` | manual export from Figma, dated immutable files |
| Compiled skill document | *derived* | `skills/dist/` | `tools/build-skills.mjs` |
| Code library | **does not exist** | — | — |
| Published documentation | **does not exist** | — | — |

Figma is the live source for anything visual. This repository is the source for everything else. The relationship is **one-directional and versioned** — the repository never writes to Figma, and Figma state is captured only as dated snapshots. Reasoning: [`0001-figma-connection-model`](docs/decisions/0001-figma-connection-model.md).

---

## 2. The three flows

### 2.1 Tokens

```
Figma Variables  ──manual export──▶  figma/variables/exports/*.json  ──✗──▶  CSS tokens  ──✗──▶  @stylos/ui
```

Variables are authored in Figma. Snapshots are exported by hand and committed as dated, immutable JSON. Nothing consumes them yet.

The conversion script and the package are both decided but unbuilt — see [`0004-frontend-library-foundations`](docs/decisions/0004-frontend-library-foundations.md).

**Break:** the export is manual and has no cadence. The committed snapshot can be — and currently is — months behind the live file. Nothing in the repository can be trusted to reflect current token values.

### 2.2 Components

```
Components in Figma      ──✗ no link ✗──      docs/components/registry/*.yaml
                                                        │
                                                        ├──▶ per-component docs (standard defined, not written)
                                                        └──▶ published surface (does not exist)
```

Components themselves live in Figma. Their metadata — level, role, flow behaviour, children, parents, notes — lives as one YAML file per component under `docs/components/registry/`, with the path mirroring each component's Figma `/` hierarchy. 96 components were imported from an Airtable export on 20 August 2026; Airtable is retired as a source. Hand-editing the YAML is the expected workflow.

`npm run validate:registry` checks references and levels **within the registry**. It does not check the registry against Figma.

**Break:** the two records share no identifiers. A component renamed, added, or removed in Figma produces no signal in the registry, and nothing can detect the divergence automatically.

### 2.3 Operations

```
skills/src/*/SKILL.md  ──build──▶  skills/dist/stylos-figma-agent.md  ──copy/paste──▶  Figma Agent  ──▶  edits Figma
```

Four skills are authored as modular Markdown under `skills/src/`, combined with the target wrapper in `skills/targets/`, and compiled by `tools/build-skills.mjs` into a single importable document (~71 KB). The Agent then performs auditable operations on the Figma library.

This is the only closed loop in the system, and the only automated step anywhere in it.

**Break:** installation is manual and unversioned. Which build is currently loaded into the Agent is not recorded anywhere.

---

## 3. Artifacts

| Artifact | Produced from | By | Committed |
| --- | --- | --- | --- |
| `skills/dist/stylos-figma-agent.md` | `skills/src/`, `skills/targets/` | `tools/build-skills.mjs` | yes |
| `docs/components/registry/*.yaml` | Airtable CSV export | `tools/import-component-registry.mjs` | yes — one-time bootstrap only |
| `docs/components/registry/import-source/*.csv` | Airtable | manual export | yes — immutable snapshot |
| `figma/variables/exports/*.json` | Figma Variables | manual export | yes — immutable, dated |

Re-running the registry importer overwrites hand edits. It is a bootstrap step, not a sync.

---

## 4. What does not exist

Stated explicitly so it is never assumed.

- **A front-end library.** No package, no dependencies, no component code. Structure is decided in [`0004`](docs/decisions/0004-frontend-library-foundations.md); building it before the Figma contracts stabilise would create maintenance without delivering anything.
- **A token pipeline.** No script converts a snapshot into CSS custom properties.
- **Any published documentation surface.** No site, no Storybook, no designer-facing portal. Documentation is Markdown in git, read in an editor.
- **A link between the registry and Figma.** No shared identifiers in either direction.
- **Per-component documentation.** The standard exists; the documents do not.

---

## 5. Known breaks

Ordered by cost of leaving them.

1. **Registry and Figma are unlinked.** Two records of the same entities with no shared identifiers. Divergence is undetectable. Cost grows with component count.
2. **Token snapshots are stale by default.** The mechanism exists; the habit does not. Neither a script nor a person can rely on the committed snapshot.
3. **Documentation is split across two homes without a rule.** Markdown in this repository and descriptions inside Figma (StateDiagram, PropTable, annotations) exist in parallel, with no statement of which is authoritative for which kind of information. Publishing before that is settled would ship a self-contradicting set.
4. **Skill installation is unversioned.** The loaded build cannot be identified.
5. **Nothing is validated by a real build.** Tokens, sizes, and component contracts have never been exercised by code.

---

## 6. Document hierarchy

**Normative — four places, nothing else:**

| | |
| --- | --- |
| `ARCHITECTURE.md` | how the system is put together |
| `docs/foundations/` | rules of the design language |
| `docs/decisions/` | why things are the way they are |
| `docs/components/registry/` | the component inventory |

**Derived:** `skills/dist/`, `figma/variables/exports/`, `CHANGELOG.md`.

**Archived:** `docs/archive/master-document.md` — a bootstrap dump written to carry the project into a new working context. It contains early ideas, superseded values, and aspirational passages presented as fact. It has **no normative force** and is not maintained. Nothing should cite it.

An open question is anything not described here and not settled by a decision record. It is not tracked as a separate list, because a separate list drifts from reality.

---

## 7. Conventions

- **Language:** English, throughout the repository, including commit messages.
- **Decisions:** any material change gets a record in `docs/decisions/`, numbered sequentially, never renumbered. Small corrective edits go straight into the relevant document and `CHANGELOG.md`.
- **Generated output is never edited by hand.** Change the source and rebuild.
- **Snapshots are immutable.** A new export is a new dated file, never an overwrite.
- **Figma is never written to from this repository.** Explicit non-goal until a reliable round trip exists.
