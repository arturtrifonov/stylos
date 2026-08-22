# Stylos — Execution plan to v0.1

How the project gets from its current state to a version that can be used to build a real product screen. This is a **working plan, not a normative document**: it does not define rules, it sequences work. Rules live in [`ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/foundations/`](docs/foundations/README.md), and [`docs/decisions/`](docs/decisions/README.md). When this plan and those documents disagree, they win and this plan is corrected.

It refines the abstract phase list in master doc [§26](docs/master-document.md#26-roadmap) into ordered work with explicit gates. Master doc phases map as: Stage 0–1 = Phase 2, Stage 2 + parts of Stage 4 = Phase 3, Stage 3 = Phase 4, Stage 5–6 = Phase 5. Phase 6 (external distribution) is deliberately out of scope here.

**Baseline:** Alpha · solo owner · 5–10 h/week · written 22 August 2026

---

## 1. Definition of done

v0.1 is reached when **one dense, real product screen exists twice — in Figma and in code — built entirely from Stylos, with no local overrides in either.**

That single gate is chosen because it is the only test that exercises every part of the chain at once: tokens must be generated and consumable, component contracts must be complete enough to build against, Figma and code APIs must actually match, and the foundations must contain no gap that forces an ad-hoc value.

Concretely, v0.1 requires all of the following:

| # | Requirement | Verified by |
| --- | --- | --- |
| 1 | Every foundation document states confirmed values, not open questions | no "Open" section blocking a component or the token script |
| 2 | A token snapshot no older than the current release, converted to CSS by script | `npm run build:tokens` |
| 3 | Every registry entry carries a Figma node identifier | `npm run validate:figma` exits 0 |
| 4 | The v0.1 core component set is documented to the §17 standard | manual review against the standard |
| 5 | `@stylos/ui` builds and renders every documented variant of that set | package build + story coverage |
| 6 | Component props map 1:1 onto Figma variant properties | mapping table per component |
| 7 | The proof screen contains zero hardcoded colors, sizes, or spacing | lint rule in the package |

**Not required for v0.1:** a native icon set, mobile support, client-brand themes beyond the contract, a public documentation site, a license, or coverage of all 96 registry components.

---

## 2. Operating principles for this plan

1. **Contracts before code.** No Svelte package until the foundations and component contracts it would consume are settled — master doc [§28.6](docs/master-document.md#286-premature-frontend-structure), ADR [0004](docs/decisions/0004-frontend-library-foundations.md).
2. **Every open decision is time-boxed to one session.** Solo projects stall on decisions, not on work. If a decision cannot be reasoned to a conclusion in one sitting, the conclusion is "adopt what Figma already does, record it as provisional, move on." A provisional ADR beats an open item.
3. **A stage is not finished until its gate passes.** Gates are mechanical where possible (a script exits 0) rather than a judgement call.
4. **Scope is cut from breadth, never from the gate.** If time runs short, fewer components — not a partially documented one.
5. **Decision work and tooling work alternate.** Stage 1 is almost entirely judgement; Stage 2 is almost entirely code. They are interleaved on purpose so a stalled decision does not stall the week.

---

## 3. Critical path

```
S0 baseline ──▶ S1 foundations ──┬──▶ S3 tokens ──▶ S5 @stylos/ui ──▶ S6 proof + docs ──▶ v0.1
                                 │                    ▲
                                 └──▶ S4 contracts ───┘
                                          ▲
                    S2 registry↔Figma ────┘  (independent of S1; run in code-work slots)
```

Everything downstream waits on **S1**. It is the longest stage and the one most likely to slip, because it is decision work with no external forcing function. Treat it as the schedule risk.

---

## 4. Stages

### Stage 0 — Make the repository truthful

**Why first:** the repository currently asserts things that are false — a six-month-old token snapshot presented as the current state, `naming-cleanup` cited at v0.5 when v0.7 is loaded, a passport with no Figma links. Every later stage builds on these statements. Correcting them costs days now and weeks later.

- [x] **Import a current snapshot.** Done 2026-08-22 — [`figma/variables/exports/2026-08-22/`](figma/variables/exports/2026-08-22/README.md), 9 collections, 996 tokens, exported by the owner from Stylos / Styles. First snapshot with a recorded source file.
- [x] **Stop transcribing token values into documentation.** `spacing.md`, `typography.md`, `effects.md`, and `color.md` now describe structure and rules and defer values to `npm run report:tokens`. A copied value is wrong at the next tweak in Figma, and a stale value in a foundation document gets built against.
- [x] **Decide how tokens are stored.** [ADR 0007](docs/decisions/0007-token-normalization.md) — Figma's export is a transport format, not a record. A normalizer produces a canonical YAML layer with Stylos's own names and an authored alias map; the raw snapshot stays as immutable evidence. Not yet implemented.
- [ ] Fill the project passport: Figma file keys and URLs for Components, Styles, GUI Helpers. Repository link resolved — `https://github.com/wrgraff/stylos`. Stage 2 cannot start without the Figma file keys.
- [ ] Record the installed skill build: add a build hash/date header to `skills/dist/stylos-figma-agent.md` and an `INSTALLED.md` line stating which build is loaded into Figma Agent. Closes known break #4.
- [ ] **Decompose the master document** per [ADR 0005](docs/decisions/0005-master-document-decomposition.md). `ARCHITECTURE.md` says it is archived with no normative force; it is in fact cited as authoritative by everything. It is also the only written copy of the naming contract, the documentation standard, the token model, and the quality bar — so it is decomposed into normative homes first, and archived only once every section has a destination and every reference has been repointed. Corrections found along the way (v0.5 → v0.7, level taxonomy, Fibonacci) are applied at the destination rather than to a file about to be archived.

**Gate:** no statement in the repository is known to be false, and `docs/master-document.md` is archived with nothing citing it. **Estimate:** 5–6 weeks.

---

### Stage 1 — Close the foundation contracts

**Why:** this is master doc Phase 2, and it blocks tokens, component documentation, and code simultaneously. Nine of the twenty open decisions live here.

Ordered by dependency — later items assume earlier ones are settled.

| # | Work | Produces | Closes |
| --- | --- | --- | --- |
| 1.1 | **Ratify** the base-8 spacing/sizing scale; decide which steps earn their place | ADR **0008**, `sizing.md` | open #3 |
| 1.2 | Review the ratio-to-base naming model already in use against the seven alternatives | `docs/research/spacing-naming.md` → ADR **0009** | open #4 |
| 1.3 | **Ratify** the typefaces Figma binds; check Cyrillic coverage, variable axes, licenses. Also reconcile the two naming inconsistencies recorded in `typography.md` | ADR **0010**, `typography.md` | open #2 |
| 1.4 | State the dark-context transformation as a rule that can be reapplied and checked, not as a set of values | ADR **0011**, `color.md` | open #9 |
| 1.5 | Define the light/dark/client-theme mode contract — which semantic roles a client theme may override | ADR **0012** | open #8 |
| 1.6 | Decide `density`: a real dimension of the system, or dropped | ADR **0013** | open #6 |
| 1.7 | **Ratify** the radius and border scales now recorded in `effects.md`; define the shadow scale, which is unresolved at source | `effects.md` | — |

**Stage 0 changed the character of this stage.** The 2026-08-20 snapshot showed that most of these are already implemented in Figma and merely unrecorded — the scale, the naming model, the typefaces, the radius and border values all exist. Four of the seven items are therefore *ratification*, not derivation: confirm what is built, or change it deliberately. Only 1.4, 1.5, and 1.6 are open questions in the original sense. That is why this stage is estimated shorter than it was before Stage 0 ran.

**Sequencing note:** 1.5 is a prerequisite for Stage 3, not merely related to it. How modes become CSS custom-property scoping is the token script's central design problem (ADR 0004, Consequences); deciding it during the script's implementation is how that script ends up wrong.

**Gate:** no foundation document contains an "Open" item that a component contract or the token script depends on. **Estimate:** 6–8 weeks.

---

### Stage 2 — Link the registry to Figma

**Why:** known break #1, and the only one whose cost grows with time. Two records of 96 entities share no identifiers today; a rename in Figma produces no signal anywhere. Run this in code-work slots alongside Stage 1's decision work.

- [ ] Extend the registry schema with a `figma:` block — `file_key`, `node_id`, `last_verified`. ADR **0014**.
- [ ] Build `tools/sync-figma-inventory.mjs`: read the three files via the Figma REST API, reconcile against the registry by name, report added / renamed / removed / unlinked. **Read-only** — the repository still never writes to Figma (ADR 0001 stands).
- [ ] Wire as `npm run validate:figma`; keep the PAT out of the repository.
- [ ] Run it and resolve every divergence it finds. Expect real drift: the registry snapshot is from 20 August 2026 and Figma has moved since.
- [ ] Backfill `node_id` for all 96 entries.

**Gate:** `npm run validate:figma` exits 0 and every registry entry resolves to a live node. **Estimate:** 4 weeks.

---

### Stage 3 — Token pipeline

**Why:** the missing link between Figma and any code at all. ADR 0004 already settled the approach (small custom script, no Style Dictionary); this stage builds it.

- [ ] `tools/build-tokens.mjs`: Figma Variables JSON → `dist/tokens/stylos.css` (CSS custom properties) + a JS map for tooling.
- [ ] Design and document the variable-path → custom-property-name rule. One deterministic rule, written down, not discovered per token.
- [ ] Implement mode scoping per ADR 0012: light at `:root`, dark under an explicit attribute, client-brand as an override layer.
- [ ] Add snapshot diffing: a token removed or renamed between two exports is flagged as breaking. This is also the release-validation step master doc Phase 4 asks for.
- [ ] Document the pinned Figma export-format assumption in the script header — Stylos now owns this mapping's maintenance (ADR 0004, accepted cost).
- [ ] ADR **0015** recording the mapping design.

**Gate:** `npm run build:tokens` produces a CSS file covering every semantic role listed in `color.md`, and the diff check catches a deliberately renamed token. **Estimate:** 4 weeks.

---

### Stage 4 — Component contracts for the core set

**Why:** the §17 standard exists; not one document written against it does. Code cannot be built from an inventory alone.

**Scope discipline:** document 23 components, not 96 — the set required to build the proof screen.

| Level | Components |
| --- | --- |
| Primitive | Icon, Badge, Indicator, Loader |
| Element | Checkbox, Radio, Toggle, Link, Tag, Label |
| Object | Button Basic, Button Icon, Input Text, Select, Table / TD Text, Table / TH Text |
| Widget | Tooltip, Dropdown, Tabs Horizontal, Toast |
| Layout | Modal, Table, Side Panel |

- [ ] **First**, settle the documentation boundary — which of the twenty §17 points live in Figma (StateDiagram, PropTable, anatomy) and which live in Markdown. ADR **0016**, closing open #14 and known break #3. Writing twenty documents before this rule exists guarantees rewriting them.
- [ ] Decide the accessibility target and browser baseline. ADR **0017**, closing open #12 — §17 requires an accessibility section per component, so this cannot be deferred to Stage 5.
- [ ] Decide the depth of component-specific tokens. ADR **0018**, closing open #5.
- [ ] Create `docs/components/_template.md` from the §17 standard so each document is mechanical rather than re-derived.
- [ ] Run `stylos-component-integrity-check` over the core set. **Fix findings in Figma before documenting** — documenting a component that fails its own integrity check records the defect as a contract.
- [ ] Write the documents, starting from each component's registry entry (level, role, composition are already filled in).

**Gate:** every core-set component has a §17 document, passes the integrity check, and links to its registry entry and Figma node. **Estimate:** 6–8 weeks.

---

### Stage 5 — `@stylos/ui` v0.1

**Why:** master doc Phase 5. Starts from the settled brief in ADR 0004, so no architecture is re-litigated here.

- [ ] Scaffold `packages/ui` — Svelte, Vite library mode, single package, no extra dependencies beyond Melt UI.
- [ ] Consume `dist/tokens/stylos.css` as the only source of visual values.
- [ ] Implement in dependency order: primitives → elements → objects → widgets → layouts. The registry's `children` field gives the order directly.
- [ ] For each component, write the prop ↔ Figma variant property mapping table. Divergence is a bug in one side or the other, not a translation detail (master doc [§15](docs/master-document.md#15-naming-and-public-api-rules)).
- [ ] Add a lint rule rejecting hex colors and raw px outside the generated token file.
- [ ] Accessibility tests against the ADR 0017 baseline.
- [ ] ADR **0019** — package API surface, build, and release structure. Closes open #16.

**Watch item:** if Melt UI cannot cover a needed interaction pattern, update ADR 0004 explicitly rather than working around it silently — that record asks for exactly this.

**Gate:** package builds; every documented variant of every core component renders; the lint rule passes. **Estimate:** 10–12 weeks.

---

### Stage 6 — Proof screen and minimum documentation surface

**Why:** the v0.1 gate itself. Nothing before this point has been validated by a real build (known break #5).

- [ ] Build one dense screen — table view with filters, side panel, and a modal — in Figma from the library.
- [ ] Build the same screen in code from `@stylos/ui`.
- [ ] Log every deviation forced along the way. These are the real gaps, and they outrank any remaining open decision as v0.1.1 input.
- [ ] Stand up the minimum documentation surface per ADR 0016: one story per core component, a tokens page, and foundations pages rendered from the existing Markdown. Not a public site — a working surface.
- [ ] Tag v0.1; write the release notes against the seven requirements in §1.

**Gate:** the screen exists twice, matches, and contains no local overrides. **Estimate:** 4 weeks.

---

## 5. Schedule

At 5–10 h/week:

| Stage | Estimate | Cumulative |
| --- | ---: | ---: |
| S0 — truthful baseline + decomposition | 5–6 wk | 6 wk |
| S1 — foundations | 6–8 wk | 14 wk |
| S2 — registry ↔ Figma | 4 wk | *parallel* |
| S3 — token pipeline | 4 wk | 18 wk |
| S4 — component contracts | 6–8 wk | 26 wk |
| S5 — `@stylos/ui` | 10–12 wk | 38 wk |
| S6 — proof + docs | 4 wk | **42 wk** |

**≈ 9–11 months** at this budget, with S2 absorbed into S1's code-work slots. That number is the honest one; treat any plan that promises v0.1 sooner at 5–10 h/week as having cut a gate rather than found efficiency.

**Scope levers, in the order they should be pulled:**

1. Cut the core set from 23 to 12 components (drop Table cells, Side Panel, Tabs, Toast) — saves ~6 weeks across S4 and S5.
2. Ship the documentation surface as plain Markdown rendering instead of Storybook — saves ~2 weeks in S6.
3. Defer `density` (1.6) and component-token depth (ADR 0018) by adopting "not a system dimension" as the provisional answer — saves ~1 week, revisit at v0.2.

Do **not** pull: the integrity check before documenting, the doc-boundary ADR before writing documents, or the proof screen.

---

## 6. Open decisions, mapped

| # | Open decision | Resolved in |
| ---: | --- | --- |
| 2 | Primary and accent typefaces | S1.3 → ADR 0010 — Figma binds them; this ratifies |
| 3 | Spacing and sizing scales | S1.1 → ADR 0008 |
| 4 | Spacing-token naming model | S1.2 → ADR 0009 — ratio-to-base already in use |
| 5 | Component-specific token depth | S4 → ADR 0018 |
| 6 | Definition of `density` | S1.6 → ADR 0013 |
| 7 | Full-word vs abbreviated size values | **already closed** by ADR 0002; master doc corrected in S0 |
| 8 | Light/dark/client-theme contract | S1.5 → ADR 0012 |
| 9 | Core-palette dark transformation rule | S1.4 → ADR 0011 |
| 10 | Component inventory and maturity | inventory exists; maturity per component in S4 |
| 11 | Typography profiles for other levels | **closed for Widget/Layout** by ADR 0003; Primitive narrowed in S0 |
| 12 | Accessibility target and browser baseline | S4 → ADR 0017 |
| 14 | Figma / Markdown / Storybook boundary | S4 → ADR 0016 |
| 15 | Code token export pipeline | S3 → ADR 0015; canonical layer settled by ADR 0007 |
| 16 | Svelte package API and release structure | S5 → ADR 0019 |
| 20 | Figma / repository / docs URLs | repo link found (`github.com/wrgraff/stylos`); Figma keys still needed in S0 |

**Deliberately unresolved before v0.1:** #1 (creation date, public contact), #13 (responsive breakpoints — desktop-only scope makes this premature), #17 (automated skill installation), #18 (custom Figma plugin), #19 (license and commercial model — master doc [§28.7](docs/master-document.md#287-commercialization-before-stabilization)).

---

## 7. Risks

| Risk | Signal it is happening | Countermeasure |
| --- | --- | --- |
| Stage 1 stalls — decision work with no forcing function | two sessions on the same open item | the one-session rule (§2.2): ship a provisional ADR that records current Figma behaviour |
| Completionism against the 96-component registry | documenting components outside the core set | the core-set table in S4 is the scope; additions require an explicit decision |
| Token script rots as Figma's export format evolves | the script breaks on a fresh export | pinned format assumption in the header + snapshot diffing (S3) |
| Melt UI cannot cover a pattern | building interaction logic by hand in S5 | update ADR 0004 explicitly rather than drifting from it |
| Registry drift resumes after S2 | `validate:figma` not run for weeks | make it part of the pre-commit habit alongside `validate:registry` |
| The proof screen gets skipped as "obvious" | v0.1 tagged without S6 | it is the gate; there is no v0.1 without it |

---

## 8. Explicitly not in this plan

Stated so they are never assumed to be in flight: a native Stylos icon set (Material Symbols stays interim), mobile support, Figma write-back from the repository, an Airtable sync of any kind, a custom Figma plugin, a public documentation site, and any licensing or commercial work.
