# Stylos — Architecture

How the system is put together: what lives where, which source is authoritative for what, how artifacts are produced, and where the chain currently breaks.

**This document is normative.** It describes the system as it actually is on the date below — not as it is intended to become. Anything that does not exist is listed as not existing. Intent, rationale, and history belong in [`docs/decisions/`](docs/decisions/README.md); rules of the design language belong in [`docs/foundations/`](docs/foundations/README.md).

**Status:** Pre-alpha · private, owner-led · last verified 6 September 2026

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
| Published documentation | *derived* | `build/` | `tools/build-site.mjs`; uploaded by hand — see §4 |

**Values are authored where they are judged by eye; contracts are authored where they can bind more than one implementation.** Colours and dimensions are decided in Figma, so Figma holds them and `tokens/` imports them. A component's contract cannot be held by Figma, because Figma is one of the two things that must satisfy it — the Svelte package is the other, and neither can be authoritative over the other. A limitation of one tool would otherwise become a rule of the system. See [`docs/components/README.md`](docs/components/README.md).

Authoring values in Figma is current practice, not a permanent commitment; moving them into the repository is an open intention with no date.

The relationship stays **one-directional**: the repository never writes to Figma. Holding the contract here does not change that — it means Figma is *checked against* the contract, not edited from the repository. Reasoning: [`0001-figma-connection-model`](docs/decisions/0001-figma-connection-model.md).

---

## 2. The three flows

### 2.1 Tokens

```
Figma Variables ──manual export──▶ tokens/*.yaml ──tokens:css──▶ packages/ui/dist/ ──▶ @stylos/ui
                                        ▲       │
                  tokens/_naming.yaml ──┘       └──▶ npm run tokens:report
```

Variables are authored in Figma. An export is made by hand and handed to `npm run tokens:import`, which folds Figma's nine collections into eight canonical ones and writes `tokens/*.yaml` — the record everything else reads. **The exported files are not committed**: read once, then discarded. `npm run tokens:check` verifies the record against itself, since `ref` and `values` are deliberately redundant.

`npm run tokens:css` projects the record onto CSS custom properties — `tools/build-css.mjs`, writing `packages/ui/dist/tokens.css` and a `tokens.json` manifest beside it ([SPEC 0007](docs/specs/0007-tokens-to-css.md)). It is a projection, not a second record: it reads `tokens/*.yaml` and nothing else, improves no value on the way through, refuses to run on a set that fails `tokens:check`, and its output is not committed. The command is `tokens:css`; there is no `tokens:build`. Its reader is `@stylos/ui` in `packages/ui` ([SPEC 0009](docs/specs/0009-stylos-ui-package.md)): every component's CSS is `var(--stylos-…)` references and nothing else, and `tokens:css` runs as the package's `prebuild` (via `npm run ui:generate`, which also generates the props types and the Storybook stories from the registry).

**Break:** the export is still manual and has no cadence. Nothing detects that Figma has moved on, so `tokens/` is only as current as the last person to import. What `npm run tokens:check` does catch is drift *within* the record — an alias that no longer agrees with the value beside it, or a mode dependence that is not declared.

### 2.2 Components

```
docs/components/registry/*.yaml  ──▶ figma.node_id ──▶  the component in Figma
                │
                ├──▶ build/components/ (generated, gitignored)
                ├──▶ the Figma description (composed; carried across by hand)
                └──▶ build/ — the site (published by hand, SPEC 0011)
```

Components themselves live in Figma. Their whole contract — level, role, purpose, boundaries, public API, accessibility findings, sizing model, limitations, relations — lives as one YAML file per component under `docs/components/registry/`, with the path mirroring each component's Figma `/` hierarchy. 96 components were imported from an Airtable export on 20 August 2026; Airtable is retired as a source. Hand-editing the YAML is the expected workflow, and there is no second document. Everything a reader meets is composed from the entry: the readable page ([`docs/components/STANDARD.md`](docs/components/STANDARD.md)) and the component's description in Figma, built from `summary`, the first `use_when` and the first `do_not_use_when` rather than authored ([`registry/README.md`](docs/components/registry/README.md)). Nothing inside Figma is documentation in its own right; what is written there is the registry, rendered.

`npm run validate:registry` checks the registry **against itself**: references resolve, ids are unique, each file sits at the path its id implies, any `figma:` block could address a real node, and every contract field that is present is internally consistent — a status or kind inside its vocabulary, a default among its property's values, a variant count that matches the product, a controlled group that is adjacent, a sizing run written as token names that resolve against `tokens/`, a value with a finding and a reason for shipping it. It separates contradictions (exit 1) from findings a human has to settle — a one-sided relation, a child at or above its parent's level, a contract missing narrative fields (exit 0). It does not check the registry against Figma.

`npm run build` renders the whole set into `build/` — the front page, the registry view, one page per component, and `assets/` beside them — and it is the command that produces an uploadable tree; `npm run build:publish` additionally builds the Storybook workshop and copies it in at `build/storybook/`, which is the tree the site ([SPEC 0011](docs/specs/0011-project-website.md)) is published from. The front page presents the system as designed and derives every mark of what exists — the Planned badges, the counts, the charts, the Storybook link — from the repository at build time, so it is never edited to match reality. `npm run registry:view` renders the registry view alone as one self-contained HTML file, where relations are links rather than files to open, and every row links to that component's page. `npm run components:view` writes those pages — one per entry under `build/components/`, the contract laid out to be read rather than parsed. It is also the one place the two records meet: a contract records dimensions as token names, and the page resolves them against `tokens/` at build time and shows the value with the name, so the scale stays legible without a number ever being copied into a contract. The pages are also the token set's first consumer in the other direction: colour, radius, the type scale and both families are resolved from `tokens/` by `tools/lib/theme.mjs` on every build and emitted as custom properties, so no Stylos value is transcribed into a stylesheet. That is a theme, not the CSS build of [`PLAN.md`](PLAN.md) Stage 5 — the pages are hand-written HTML and use no Stylos component. Two flags are derived at build time and never authored: `documented` (the contract carries a summary, a purpose, a `use_when` and a description on every property) and `linked` (a Figma node is recorded). Neither output is committed — both are cheap to rebuild and would put a diff the size of the whole registry into every registry change.

An entry carries a `figma:` block naming the file and node it is implemented by, with a `last_verified` date. A complete contract requires it ([`STANDARD.md`](docs/components/STANDARD.md)), so an entry has the address exactly when it has a contract — 39 of 114 at the time of writing — and it arrives with the contract rather than in a sweep of its own.

**What the address does not do is detect anything.** Nothing polls Figma: a component renamed, added or removed there still produces no signal here, and `last_verified` is the only freshness the repository has — a date a person set, aging on its own. The address makes divergence checkable by hand, not detected.

### 2.3 Operations

```
skills/src/*/SKILL.md  ──build──▶  skills/dist/stylos-figma-agent.md  ──copy/paste──▶  Figma Agent  ──▶  edits Figma
```

Four skills are authored as modular Markdown under `skills/src/`, combined with the target wrapper in `skills/targets/`, and compiled by `tools/build-skills.mjs` into a single importable document. The Agent then performs auditable operations on the Figma library.

This is the only closed loop in the system, and the only automated step anywhere in it.

**Break:** installation is manual. The document is pasted into the Agent by hand, on no cadence, and nothing here can tell that it was. It is no longer *unversioned* — the build has appended each source's `metadata.version` to its description since 2026-08-24, so the loaded build names itself (§5).

---

## 3. Artifacts

| Artifact | Produced from | By | Committed |
| --- | --- | --- | --- |
| `skills/dist/stylos-figma-agent.md` | `skills/src/`, `skills/targets/` | `tools/build-skills.mjs` | yes |
| `docs/components/registry/*.yaml` | Airtable CSV export | `tools/import-component-registry.mjs` | yes — hand-edited since; the importer is retired |
| `build/` — the whole site, `build/storybook/` included when built | `docs/components/registry/*.yaml`, `tokens/`, `assets/`, `PLAN.md`, `figma/README.md`, `apps/workshop/storybook-static/` | `tools/build-site.mjs` | no — derived, rebuilt on demand |
| `build/registry.html` | `docs/components/registry/*.yaml` | `tools/build-registry-view.mjs` | no — derived, rebuilt on demand |
| `docs/components/registry/import-source/*.csv` | Airtable | manual export | yes — immutable snapshot |
| `tokens/*.yaml` | a Figma export and `tokens/_naming.yaml` | `tools/import-tokens.mjs` | yes — generated, never hand-edited |
| `tokens/_history.yaml` | each import run | `tools/import-tokens.mjs` | yes — generated, never hand-edited |
| `figma/library.yaml` | a Figma export of the `meta` collection | `tools/import-tokens.mjs` | yes — generated, never hand-edited |
| `packages/ui/dist/tokens.css`, `tokens.json` | `tokens/*.yaml` | `tools/build-css.mjs` | no — derived, rebuilt on demand |
| `packages/ui/src/components/*/props.ts` | `docs/components/registry/*.yaml` | `tools/build-ui-types.mjs` | no — derived, rebuilt on demand |
| `apps/workshop/stories/generated/` | `docs/components/registry/*.yaml` | `tools/build-ui-stories.mjs` | no — derived, rebuilt on demand |
| `packages/ui/dist/package/` | `packages/ui/src/` | `svelte-package` | no — derived, rebuilt on demand |
| `packages/ui/dist/css/<name>.css`, `dist/css/stylos.css` — the CSS export, per component and in aggregate, consumable without Svelte | `packages/ui/src/components/<name>/<name>.css` | `tools/build-ui-css.mjs` | no — derived, rebuilt on demand |
| `packages/ui/dist/fonts.css`, `dist/assets/fonts/` — the font export: the `@font-face` rules and woff2 subsets behind the families `tokens.css` names | `assets/fonts/`, `FONT_FACES` in `tools/lib/theme.mjs` | `tools/build-ui-fonts.mjs` | no — derived, rebuilt on demand |
| `figma/text-styles.yaml` — the record of the Figma text styles, aliases into `tokens/`, never raw values | a Plugin API read of the Styles file (Figma has no export for Styles) | `tools/import-styles.mjs` | yes — generated, never hand-edited |
| `packages/ui/dist/text.css` — the text-style export: one class per recorded style, every value a `var()` into `tokens.css` | `figma/text-styles.yaml` | `tools/build-text-css.mjs` | no — derived, rebuilt on demand |

The registry importer ran once, on 2026-08-20. It deletes and rewrites every file rather than merging, so it is kept as the record of how the registry came to exist and refuses to run without `--overwrite-hand-edits`.

---

## 4. What does not exist

Stated explicitly so it is never assumed.

- **A deployed documentation surface.** *Amended 2026-09-06:* the site itself now exists — `npm run build` renders a real front page, the registry view and the component pages as one publishable tree, and `npm run build:publish` folds the built Storybook workshop into it at `build/storybook/` ([SPEC 0011](docs/specs/0011-project-website.md)). What still does not exist is the deployed instance: uploading the tree to `stylos.arturtrifonov.com` is the owner's manual act, on no cadence, and nothing here knows whether the published copy is current. Normative documentation is still Markdown in git; the site is a derived view of it.
- **Per-component contracts.** The standard, the schema, the validator and the page generator exist; most entries still carry the inventory record only. How many is derived — `documented` in the registry view — rather than restated here.

---

## 5. Known breaks

Ordered by cost of leaving them.

1. **The token record is stale by default.** The import mechanism exists; the habit does not. Neither a script nor a person can rely on `tokens/` reflecting the live Figma file.
2. **Nothing is validated by a real build.** Tokens, sizes, and component contracts have never been exercised by code.

**Three breaks closed, 2026-09-04.** *Registry and Figma are unlinked* — a contract carries `figma.node_id` and `last_verified`, so divergence is checkable by hand for every entry that has one; the entries that do not are the ones with no contract, which §4 already states rather than counting twice. *Documentation is split across two homes without a rule* — there is one source, the registry entry, and both the generated page and the Figma description are composed from it (§2.2). *Skill installation is unversioned* — `tools/build-skills.mjs` has appended each source's `metadata.version` to its description since 2026-08-24, and the loaded build names itself.

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
- **`master` is the release line, reached only by pull request.** Nothing is committed to it directly and nothing is merged into it locally: work branches from `master`, goes up with `gh pr create`, passes CI, and lands by squash-merge on GitHub. The git hooks in `.githooks/` and the shared `.claude/settings.json` enforce this locally; branch protection enforces it on the server. Built by [SPEC 0008](docs/specs/0008-development-and-release-flow.md).
- **A pull request is not a release.** A release is a decision, taken when a stage gate in [`PLAN.md`](PLAN.md) §1 is met, or when one of the three versioned things — a registry contract's `api`, the `tokens/` set, the published Figma library (§9) — changed in a way that has to be named and handed to a consumer. Everything else accumulates under `## [Unreleased]` in `CHANGELOG.md` until a release carries it out, and bumps no version.
- **Definition of done for a pull request:** `npm test`, `npm run validate:registry`, `npm run validate:skills` and `npm run tokens:check` all pass; every document describing a capability the PR changes is corrected in the same PR; a `## [Unreleased]` line is added when the change is worth a release note; generated output changes only by rebuilding its source.

---

## 8. The queue: milestones, releases, waves

Three words for three different things. "Where are we" is unanswerable when they are used interchangeably, which is how the Airtable batch numbers came to be read as a plan.

**A milestone is a decision about distribution.** `0.1`, `alpha`, `beta`, `1.0`. `0.1` opens the decision that the Figma library is published and can be built against; its checklist is `PLAN.md` §4, which is why it is the one milestone §9 does not list. The list under it is the checklist that decision waits on: everything in it done and the decision is open; anything missing and it is not. A milestone is deliberately **not a size budget** — putting more into one moves the decision later, it does not make the milestone wrong, so including something is cheap and leaving it out is not. Every registry entry carries exactly one, and `Parked` is a real value: work no decision waits on.

**A release is a tag.** A number, chosen in `CHANGELOG.md` at the moment it is cut. How many releases fall between two milestones, and which number a milestone ships under, is not decided in advance and is written nowhere until it happens.

**A wave is a unit of work** — a few components that end in something that renders, small enough to close. Waves are numbered continuously across the whole road and never restart inside a milestone. They exist only where the horizon is close enough to cut them, so an entry with a milestone and no wave is unsequenced work, not a gap.

**Both tables live in [`PLAN.md`](PLAN.md) and nowhere else** — §4 the waves, §9 the milestones — and they are **read, never copied**. `tools/lib/plan.mjs` parses them on every build, so no page can show an order the plan has stopped stating, and nothing holds a second copy of the membership.

**There is no `wave:` or `milestone:` field on a registry entry.** It would put the plan's sequence into a hundred files that are edited for entirely different reasons, and the two would part company within a week. The queue is a fact about the plan, not about the component.

Two invariants, both mechanical:

- **Every entry is placed exactly once.** An id named by neither table is reported by `npm run validate:registry`.
- **Every name resolves.** An id named by either table that the registry does not hold fails the build rather than being skipped, because a checklist quietly one component short is a wrong answer nobody would catch.

---

## 9. Versioning

**One version line covers the system** — the contracts in `docs/components/registry/`, the canonical set in `tokens/`, and the Figma library that implements them. They cannot drift by design: a registry entry *is* that library's contract and holds its `figma.node_id`, so versioning them apart would track a difference that must not be allowed to exist. The number lives in `package.json`, and a git tag names it.

**`@stylos/ui` shares the system's number, in lockstep, until `1.0`.** The package's `0.2.0` implements the system's `0.2.0`; one number, one line. A separate schedule — the package carrying its own semver and declaring in one line which system version it implements — returns as an option to revisit at `1.0`.

**Semver is read against the contract, not against the code.**

| | |
| --- | --- |
| **Major** | a component is removed, or a documented property, value or state disappears |
| **Minor** | a component is added, or a property, value or state is added without changing what exists |
| **Patch** | appearance, tokens, prose, findings — any change that leaves the API where it was |

**Below `1.0` that table is a description, not a promise.** A major change may ship in a minor release; the only commitment is that the notes name it. A stability guarantee a solo project cannot honour is worth less than no guarantee at all, because it is believed once.

### What breaks a Figma instance

Figma has no semver, and a consumer cannot pin or install an earlier version of a library — an update is to the latest publish or nothing. Compatibility there is therefore not version negotiation but one question, asked of every change.

**Breaks instances:** deleting a component or component set; deleting a variant that instances use; deleting a property, or changing its type; moving a component to another file, which mints a new key and orphans every instance of it.

**Does not break instances:** renaming the component, whose key is stable; adding a property with a default, or adding values or variants; any change to appearance, tokens, layer structure or description.

That is what the table above means when the change is made in Figma rather than in a file.

### Where a version is written

| | |
| --- | --- |
| `package.json` | the number itself |
| a git tag | annotated, on the commit that is the release |
| `CHANGELOG.md` | the notes, with a `### Figma library` subsection recording the publish and what moved in it |
| `meta/version` in *Stylos / Styles* | a string variable naming the release the published library belongs to |

**`CHANGELOG.md` is the only source of notes.** The GitHub release body and the Figma publish description are copies of it, made at the moment of release and never edited afterwards.

**`meta/version` is checked, not trusted.** `npm run tokens:import` records it in `figma/library.yaml` and `npm run tokens:check` fails when it disagrees with `package.json`. Because the export is manual, it answers what the library reported at the last export and nothing about right now — which is enough, since the moment it matters is the release.

**The milestone list is not duplicated outside `PLAN.md` §9**, GitHub Milestones included. §8 says why.
