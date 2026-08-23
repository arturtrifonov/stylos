# Stylos — Execution plan to v0.1

How the project gets from here to a version that can build a real product screen.

**This plan carries sequence, gates and estimates — not status.** What is done is answered by the repository and by git, never by a checkbox here. A plan that also tracks state has to be edited every time work lands, and then it rots between edits like any document that copies facts living elsewhere. This one changes when the *order* or the *destination* changes, which is rare and worth noticing.

Not normative. Rules live in [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`docs/foundations/`](docs/foundations/README.md); they win on any conflict. Things to be built get a work order in [`docs/specs/`](docs/specs/README.md).

**Baseline:** pre-alpha · solo owner · 5–10 h/week

---

## 1. Definition of done

v0.1 is reached when **one dense, real product screen exists twice — in Figma and in code — built entirely from Stylos, with no local overrides in either.**

That single gate is chosen because it is the only test that exercises the whole chain at once: tokens must be consumable, component contracts complete enough to build against, Figma and code APIs actually matching, and the foundations free of any gap that forces an ad-hoc value.

| # | Requirement | Verified by |
| --- | --- | --- |
| 1 | No foundation document leaves open a question a component or the CSS build depends on | reading them |
| 2 | Tokens generate to CSS custom properties from the canonical set | the build command |
| 3 | Every registry entry carries a Figma node identifier | the registry check |
| 4 | The v0.1 core component set meets [`STANDARD.md`](docs/components/STANDARD.md) | review against the standard |
| 5 | `@stylos/ui` builds and renders every documented variant of that set | package build |
| 6 | Component props map 1:1 onto Figma variant properties | mapping table per component |
| 7 | The proof screen contains no hardcoded colour, size or spacing | lint rule in the package |

**Not required for v0.1:** a native icon set, mobile support, client-brand themes beyond the contract, a public documentation site, a license, or coverage of all 96 registry components.

---

## 2. Operating principles

1. **Contracts before code.** No Svelte package until the foundations and component contracts it would consume are settled.
2. **Every open question is time-boxed to one session.** Solo projects stall on decisions, not on work. If a question cannot be reasoned to a conclusion in one sitting, the conclusion is "adopt what Figma already does, write it down as provisional, move on."
3. **A stage is not finished until its gate passes.** Gates are mechanical where possible — a command exits 0 — rather than a judgement call.
4. **Scope is cut from breadth, never from the gate.** If time runs short, fewer components — not a partially documented one.
5. **Decision work and tooling work alternate**, so a stalled question does not stall the week.
6. **Write the rule, not the record of deciding it.** A rule in `foundations/` is cheap to change and gets read while working; at pre-alpha that is worth more than a decision log.

---

## 3. Critical path

```
S0 truthful baseline ──▶ S1 foundations ──┬──▶ S3 CSS ──▶ S5 @stylos/ui ──▶ S6 proof ──▶ v0.1
                                          │                  ▲
                                          └──▶ S4 contracts ─┘
                                                    ▲
                      S2 registry↔Figma ────────────┘   (independent of S1)
```

Everything downstream waits on **S1**. It is the stage most likely to slip, because it is judgement work with no external forcing function.

---

## 4. Stages

### Stage 0 — Make the repository truthful

**Why first:** every later stage builds on what the repository asserts. Where it asserts something false, the cost compounds.

- Record the Figma file keys for Components and GUI Helpers. Styles is known. **S2 cannot start without them.**
- Make the installed skill build identifiable. Figma does not carry the `metadata` block, so a version number cannot round-trip; the version belongs in `description`, which Figma does carry.

**Gate:** nothing in the repository is known to be false.
**Estimate:** under a week.

---

### Stage 1 — Close the foundation contracts

**Why:** blocks tokens, component documentation and code simultaneously.

Ordered by dependency.

| # | Work | Produces |
| --- | --- | --- |
| 1.1 | Ratify the base-8 spacing/sizing scale — which steps earn their place | `spacing.md`, `sizing.md` |
| 1.2 | Review the ratio-to-base naming model against the alternatives | `docs/research/`, then `spacing.md` |
| 1.3 | Fix the stale variable names in `text-sizing` and `component-integrity-check`, which bind to a path Figma no longer has | the two skill sources |
| 1.4 | State the dark-context transformation as a rule that can be reapplied and checked, not as a set of values | `color.md` |
| 1.5 | Define the light/dark/client-theme contract — which semantic roles a client theme may override | `color.md` |
| 1.6 | Decide `density`: a real dimension of the system, or dropped | `naming.md` |
| 1.7 | Ratify the radius and border scales; define the shadow scale | `effects.md` |

**Much of this is ratification, not derivation.** The scale, the naming model, the radius and border values all exist in Figma already — the work is confirming what is built or changing it deliberately, and writing it down. Typography is settled. Only 1.4, 1.5 and 1.6 are open in the original sense.

**Gate:** no foundation document leaves open a question a component contract or the CSS build depends on.
**Estimate:** 6–8 weeks.

---

### Stage 2 — Link the registry to Figma

**Why:** two records of 96 components share no identifiers, so divergence is undetectable and the cost grows with time. Run this in code-work slots alongside Stage 1's judgement work.

- Extend the registry schema with `figma:` — `file_key`, `node_id`, `last_verified`.
- A read-only reconciliation script: read the Components and GUI files via the Figma REST API, compare against the registry by name, report added / renamed / removed / unlinked. The repository still never writes to Figma.
- Resolve every divergence it finds. Expect real drift — the registry is a snapshot of Airtable from 20 August 2026.
- Backfill `node_id` for all 96 entries.

**Note:** the Variables REST API is Enterprise-only, but the *files* API used here is not. Confirm before scheduling.

**Gate:** the registry check exits 0 and every entry resolves to a live node.
**Estimate:** 4 weeks.

---

### Stage 3 — Tokens to CSS

**Why:** the last link between Figma and any code.

The import and canonical layers are built ([SPEC 0001](docs/specs/0001-token-pipeline.md)). What remains is generation:

- `tokens/*.yaml` → CSS custom properties, preserving the primitive/semantic indirection so palette overrides propagate.
- One deterministic, documented rule for token name → custom property name.
- Mode scoping per the contract settled in 1.5.
- Fail on a token that disappeared between runs without acknowledgement — the release-validation step.

**Gate:** the build produces CSS covering every semantic role, and a deliberately renamed token fails the check.
**Estimate:** 1 week.

---

### Stage 4 — Component contracts for the core set

**Scope discipline:** 23 components, not 96 — the set the proof screen needs.

| Level | Components |
| --- | --- |
| Primitive | Icon, Badge, Indicator, Loader |
| Element | Checkbox, Radio, Toggle, Link, Tag, Label |
| Object | Button Basic, Button Icon, Input Text, Select, Table / TD Text, Table / TH Text |
| Widget | Tooltip, Dropdown, Tabs Horizontal, Toast |
| Layout | Modal, Table, Side Panel |

- **First**, settle the documentation boundary — which of `STANDARD.md`'s twenty points live in Figma and which in Markdown. Writing twenty documents before that rule exists guarantees rewriting them.
- Decide the accessibility target and browser baseline. `STANDARD.md` requires an accessibility section per component, so it cannot wait for Stage 5.
- Decide the depth of component-specific tokens.
- Create `docs/components/_template.md` so each document is mechanical rather than re-derived.
- Run `stylos-component-integrity-check` over the set and **fix findings in Figma before documenting** — otherwise the defect gets written down as the contract.
- Write the documents, starting from each registry entry.

**Gate:** every core component has a document meeting the standard, passes the integrity check, and links to its registry entry and Figma node.
**Estimate:** 6–8 weeks.

---

### Stage 5 — `@stylos/ui`

**Planned approach**, not yet committed — revisit when the work actually starts:

- **One package**, `@stylos/ui`, rather than splitting tokens/icons/components. Simplest to version for a solo maintainer; splitting later is a mechanical extraction, not a redesign.
- **Plain CSS + custom properties** for component internals, referencing the same properties consumer theming uses. No build-time styling dependency, one styling vocabulary, and a component's internals and a consumer's override become the same mechanism rather than two layers.
- **A headless behaviour library** for accessible interactive components — Melt UI is the leading candidate, because it supplies behaviour only and leaves anatomy, layer names and DOM structure authored by Stylos. A library that ships its own markup would mean working around its structure instead of authoring ours, which conflicts with the naming rules already in force. Building all interaction logic by hand is too much accessibility surface to get right solo.
- Svelte, per the project's stated direction.

Work:

- Scaffold the package; consume the generated CSS as the only source of visual values.
- Implement in dependency order — primitives → elements → objects → widgets → layouts. The registry's `children` field gives the order.
- Per component, a prop ↔ Figma variant property mapping table. Divergence is a bug in one side, not a translation detail.
- A lint rule rejecting hex colours and raw px outside the generated token file.
- Accessibility tests against the baseline set in Stage 4.

**Gate:** the package builds, every documented variant renders, the lint rule passes.
**Estimate:** 10–12 weeks.

---

### Stage 6 — Proof screen and minimum documentation surface

**Why:** the v0.1 gate itself. Nothing before this has been validated by a real build.

- Build one dense screen — table view with filters, side panel, modal — in Figma from the library.
- Build the same screen in code from `@stylos/ui`.
- Log every deviation forced along the way. Those are the real gaps and they outrank any remaining open question as v0.1.1 input.
- Stand up a minimum documentation surface: one story per core component, a tokens page, foundations rendered from the existing Markdown. Not a public site.
- Tag v0.1; write release notes against the seven requirements in §1.

**Gate:** the screen exists twice, matches, and contains no local overrides.
**Estimate:** 4 weeks.

---

## 5. Schedule

At 5–10 h/week:

| Stage | Estimate | Cumulative |
| --- | ---: | ---: |
| S0 — truthful baseline | <1 wk | 1 wk |
| S1 — foundations | 6–8 wk | 9 wk |
| S2 — registry ↔ Figma | 4 wk | *parallel* |
| S3 — tokens to CSS | 1 wk | 10 wk |
| S4 — component contracts | 6–8 wk | 18 wk |
| S5 — `@stylos/ui` | 10–12 wk | 30 wk |
| S6 — proof + docs | 4 wk | **34 wk** |

**≈ 7–9 months**, with S2 absorbed into S1's code-work slots. Treat any plan promising v0.1 sooner at this budget as having cut a gate rather than found efficiency.

**Scope levers, in the order to pull them:**

1. Cut the core set from 23 to 12 components — drop Table cells, Side Panel, Tabs, Toast. Saves ~6 weeks across S4 and S5.
2. Ship the documentation surface as rendered Markdown instead of Storybook. Saves ~2 weeks in S6.
3. Defer `density` (1.6) and component-token depth by adopting "not a system dimension" as the provisional answer. Saves ~1 week.

Do **not** pull: the integrity check before documenting, the documentation-boundary decision before writing documents, or the proof screen.

---

## 6. Open questions, and where each is answered

| Question | Stage |
| --- | --- |
| Spacing and sizing scale — which steps stay | 1.1 |
| Spacing naming model — ratio-to-base is in use; is it right | 1.2 |
| Dark-context transformation as a rule | 1.4 |
| Light/dark/client-theme contract | 1.5 |
| Definition of `density` | 1.6 |
| Radius, border, shadow scales | 1.7 |
| Registry ↔ Figma identity | 2 |
| Token name → CSS custom property mapping | 3 |
| Figma / Markdown documentation boundary | 4 |
| Accessibility target and browser baseline | 4 |
| Component-specific token depth | 4 |
| Component inventory maturity | 4 |
| Svelte package API and release structure | 5 |

**Deliberately unanswered before v0.1:** the project's public contact details, responsive breakpoints (desktop-only scope makes them premature), automated skill installation, and the license and commercial model.

**A Stylos Figma plugin is intended**, and the reason is ergonomic rather than technical: it removes the manual export and the JSON handling from the loop entirely, so updating tokens stops being a matter of running scripts over downloaded files. It also opens the direction of authoring the palette outside Figma and having the plugin bring colours in cleanly, which the export path cannot do.

Its scope and timing are open, not its existence. It is not on the critical path to v0.1 — the current pipeline works — so it is scheduled when the manual step becomes the thing slowing the week down.

---

## 7. Risks

| Risk | Signal | Countermeasure |
| --- | --- | --- |
| Stage 1 stalls — judgement work with no forcing function | two sessions on the same question | §2.2: adopt what Figma does, write it down as provisional |
| Completionism against the 96-component registry | documenting outside the core set | the Stage 4 table is the scope |
| Registry drift resumes after S2 | the check not run for weeks | make it part of the pre-commit habit |
| Documentation drifts from the built system | a document describing something that no longer exists | keep facts in one place; documents point rather than copy |
| The proof screen gets skipped as "obvious" | v0.1 tagged without S6 | it is the gate |

---

## 8. Explicitly not in this plan

A native Stylos icon set (Material Symbols stays interim), mobile support, writing to Figma from the repository, an Airtable sync, a public documentation site, and any licensing or commercial work.
