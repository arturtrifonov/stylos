# Stylos — Architecture

How the system is put together: what lives where, which source is authoritative for what, how artifacts are produced, and where the chain currently breaks.

**This document is normative.** It describes the system as it actually is on the date below — not as it is intended to become. Anything that does not exist is listed as not existing. Intent, rationale, and history belong in [`docs/decisions/`](docs/decisions/README.md); rules of the design language belong in [`docs/foundations/`](docs/foundations/README.md).

**Status:** Alpha · private, owner-led · last verified 22 August 2026

---

## 1. Sources of truth

Every domain has exactly one authoritative source. When two places disagree, the source below wins and the other is corrected.

| Domain | Source of truth | Location | How it changes |
| --- | --- | --- | --- |
| Variables, styles — the *values* | Figma | Figma cloud | by hand in the file |
| Components — the *contract* | YAML registry | `docs/components/registry/` | by hand, validated by `npm run validate:registry`, read with `npm run registry:view` |
| Components in Figma — one *implementation* of that contract | Figma | Figma cloud | by hand, or via skills through Figma Agent |
| Foundation rules | Markdown | `docs/foundations/` | by hand |
| Architectural decisions | Markdown | `docs/decisions/` | by hand, one record per material change |
| Skill behaviour | Markdown sources | `skills/src/` | by hand, compiled to `skills/dist/` |
| System structure | this document | `ARCHITECTURE.md` | by hand |
| The queue — what is worked when | Markdown | `PLAN.md` §4 and §9 | by hand, read by `tools/lib/plan.mjs`, never copied — see §8 |
| Canonical tokens | *derived* | `tokens/` | `tools/import-tokens.mjs`, from a Figma export plus `tokens/_naming.yaml` |
| Figma-to-Stylos naming, slots, mode rules | YAML | `tokens/_naming.yaml` | by hand, validated by `npm run tokens:check` |
| Compiled skill document | *derived* | `skills/dist/` | `tools/build-skills.mjs` |
| Code library | **does not exist** | — | — |
| Published documentation | **does not exist** | — | — |

**Values are authored where they are judged by eye; contracts are authored where they can bind more than one implementation.** Colours and dimensions are decided in Figma, so Figma holds them and `tokens/` imports them. A component's contract cannot be held by Figma, because Figma is one of the two things that must satisfy it — the Svelte package is the other, and neither can be authoritative over the other. A limitation of one tool would otherwise become a rule of the system. See [`docs/components/README.md`](docs/components/README.md).

Authoring values in Figma is current practice, not a permanent commitment; moving them into the repository is an open intention with no date.

The relationship stays **one-directional**: the repository never writes to Figma. Holding the contract here does not change that — it means Figma is *checked against* the contract, not edited from the repository. Reasoning: [`0001-figma-connection-model`](docs/decisions/0001-figma-connection-model.md).

---

## 2. The three flows

### 2.1 Tokens

```
Figma Variables ──manual export──▶ tokens/*.yaml ──✗──▶ CSS ──✗──▶ @stylos/ui
                                        ▲       │
   tokens/_naming.yaml, _aliases.yaml ──┘       └──▶ npm run tokens:report
```

Variables are authored in Figma. An export is made by hand and handed to `npm run tokens:import`, which folds Figma's nine collections into eight canonical ones and writes `tokens/*.yaml` — the record everything else reads. **The exported files are not committed**: read once, then discarded. `npm run tokens:check` verifies the record against itself, since `ref` and `values` are deliberately redundant.

The CSS conversion (`tokens:build`) and the package are both planned but unbuilt — see [`PLAN.md`](PLAN.md) Stages 3 and 5.

**Break:** the export is still manual and has no cadence. Nothing detects that Figma has moved on, so `tokens/` is only as current as the last person to import. What `npm run tokens:check` does catch is drift *within* the record — an alias that no longer agrees with the value beside it, or a mode dependence that is not declared.

### 2.2 Components

```
Components in Figma      ──✗ no link ✗──      docs/components/registry/*.yaml
                                                        │
                                                        ├──▶ build/components/ (generated, gitignored)
                                                        └──▶ published surface (does not exist)
```

Components themselves live in Figma. Their whole contract — level, role, purpose, boundaries, public API, accessibility findings, sizing model, limitations, relations — lives as one YAML file per component under `docs/components/registry/`, with the path mirroring each component's Figma `/` hierarchy. 96 components were imported from an Airtable export on 20 August 2026; Airtable is retired as a source. Hand-editing the YAML is the expected workflow, and there is no second document: the readable page is generated from the entry ([`docs/components/STANDARD.md`](docs/components/STANDARD.md)).

`npm run validate:registry` checks the registry **against itself**: references resolve, ids are unique, each file sits at the path its id implies, any `figma:` block could address a real node, and every contract field that is present is internally consistent — a status or kind inside its vocabulary, a default among its property's values, a variant count that matches the product, a controlled group that is adjacent, a sizing run written as token names that resolve against `tokens/`, a value with a finding and a reason for shipping it. It separates contradictions (exit 1) from findings a human has to settle — a one-sided relation, a child at or above its parent's level, a contract missing narrative fields (exit 0). It does not check the registry against Figma.

`npm run build` renders the whole set into `build/` — a home page, the registry view, one page per component, and `assets/` beside them — and it is the only command that produces an uploadable tree. `npm run registry:view` renders the registry view alone as one self-contained HTML file, where relations are links rather than files to open, and every row links to that component's page. `npm run components:view` writes those pages — one per entry under `build/components/`, the contract laid out to be read rather than parsed. It is also the one place the two records meet: a contract records dimensions as token names, and the page resolves them against `tokens/` at build time and shows the value with the name, so the scale stays legible without a number ever being copied into a contract. The pages are also the token set's first consumer in the other direction: colour, radius, the type scale and both families are resolved from `tokens/` by `tools/lib/theme.mjs` on every build and emitted as custom properties, so no Stylos value is transcribed into a stylesheet. That is a theme, not the CSS build of [`PLAN.md`](PLAN.md) Stage 3 — the pages are hand-written HTML and use no Stylos component. Two flags are derived at build time and never authored: `documented` (the contract carries a summary, a purpose, a `use_when` and a description on every property) and `linked` (a Figma node is recorded). Neither output is committed — both are cheap to rebuild and would put a diff the size of the whole registry into every registry change.

An entry may carry a `figma:` block naming the file and node it is implemented by. That is a hand-recorded address, not a sync: it is filled in when a component is opened in Figma for other reasons.

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
| `docs/components/registry/*.yaml` | Airtable CSV export | `tools/import-component-registry.mjs` | yes — hand-edited since; the importer is retired |
| `build/` — the whole site | `docs/components/registry/*.yaml`, `tokens/`, `assets/` | `tools/build-site.mjs` | no — derived, rebuilt on demand |
| `build/registry.html` | `docs/components/registry/*.yaml` | `tools/build-registry-view.mjs` | no — derived, rebuilt on demand |
| `docs/components/registry/import-source/*.csv` | Airtable | manual export | yes — immutable snapshot |
| `tokens/*.yaml` | a Figma export and `tokens/_naming.yaml` | `tools/import-tokens.mjs` | yes — generated, never hand-edited |

The registry importer ran once, on 2026-08-20. It deletes and rewrites every file rather than merging, so it is kept as the record of how the registry came to exist and refuses to run without `--overwrite-hand-edits`.

---

## 4. What does not exist

Stated explicitly so it is never assumed.

- **A front-end library.** No package, no dependencies, no component code. The intended structure is sketched in [`PLAN.md`](PLAN.md) Stage 5; building it before the Figma contracts stabilise would create maintenance without delivering anything.
- **CSS token output.** The token pipeline exists and produces the canonical set (`tokens/*.yaml`), but no script converts it into CSS custom properties yet — that is `tokens:build`, a later spec.
- **Any published documentation surface.** No site, no Storybook, no designer-facing portal. Documentation is Markdown in git, read in an editor.
- **A link between the registry and Figma.** No shared identifiers in either direction.
- **Per-component contracts.** The standard, the schema, the validator and the page generator exist; most entries still carry the inventory record only. How many is derived — `documented` in the registry view — rather than restated here.

---

## 5. Known breaks

Ordered by cost of leaving them.

1. **Registry and Figma are unlinked.** Two records of the same entities with no shared identifiers. Divergence is undetectable. Cost grows with component count.
2. **The token record is stale by default.** The import mechanism exists; the habit does not. Neither a script nor a person can rely on `tokens/` reflecting the live Figma file.
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
| `docs/decisions/` | the few boundaries expensive enough to reverse that they earn a record |
| `docs/components/registry/` | the component inventory |

**Derived:** `skills/dist/`, `tokens/*.yaml`, `CHANGELOG.md`.

An open question is anything not settled by a rule in `docs/foundations/` or by this document. It is not tracked as a separate list, because a separate list drifts from reality; open questions are attached to the stage that answers them in [`PLAN.md`](PLAN.md).

---

## 7. Conventions

- **Language:** English, throughout the repository, including commit messages.
- **Rules go in `docs/foundations/`**, each with its reasoning in a sentence. A decision record is reserved for a boundary that is expensive to reverse and keeps being re-opened — see [`docs/decisions/README.md`](docs/decisions/README.md). Everything else is a rule, a work order in `docs/specs/`, or a `CHANGELOG.md` line.
- **Generated output is never edited by hand.** Change the source and rebuild.
- **Figma exports are not kept.** `npm run tokens:import` reads one and writes `tokens/`; the export itself is discarded. History lives in git.
- **Figma is never written to from this repository.** Explicit non-goal until a reliable round trip exists.

---

## 8. The queue: milestones, releases, waves

Three words for three different things. "Where are we" is unanswerable when they are used interchangeably, which is how the Airtable batch numbers came to be read as a plan.

**A milestone is a decision about distribution.** `0.1`, `alpha`, `beta`, `1.0`. The list under it is the checklist that decision waits on: everything in it done and the decision is open; anything missing and it is not. A milestone is deliberately **not a size budget** — putting more into one moves the decision later, it does not make the milestone wrong, so including something is cheap and leaving it out is not. Every registry entry carries exactly one, and `Parked` is a real value: work no decision waits on.

**A release is a tag.** A number, chosen in `CHANGELOG.md` at the moment it is cut. How many releases fall between two milestones, and which number a milestone ships under, is not decided in advance and is written nowhere until it happens.

**A wave is a unit of work** — a few components that end in something that renders, small enough to close. Waves are numbered continuously across the whole road and never restart inside a milestone. They exist only where the horizon is close enough to cut them, so an entry with a milestone and no wave is unsequenced work, not a gap.

**Both tables live in [`PLAN.md`](PLAN.md) and nowhere else** — §4 the waves, §9 the milestones — and they are **read, never copied**. `tools/lib/plan.mjs` parses them on every build, so no page can show an order the plan has stopped stating, and nothing holds a second copy of the membership.

**There is no `wave:` or `milestone:` field on a registry entry.** It would put the plan's sequence into a hundred files that are edited for entirely different reasons, and the two would part company within a week. The queue is a fact about the plan, not about the component.

Two invariants, both mechanical:

- **Every entry is placed exactly once.** An id named by neither table is reported by `npm run validate:registry`.
- **Every name resolves.** An id named by either table that the registry does not hold fails the build rather than being skipped, because a checklist quietly one component short is a wrong answer nobody would catch.
