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
| 3 | Every core-set entry carries a Figma node identifier, and the registry is readable | the registry view |
| 4 | The v0.1 core component set meets [`STANDARD.md`](docs/components/STANDARD.md) | review against the standard |
| 5 | `@stylos/ui` builds and renders every documented variant of that set | package build |
| 6 | Component props map 1:1 onto Figma variant properties | mapping table per component |
| 7 | The proof screen contains no hardcoded colour, size or spacing | lint rule in the package |

**Not required for v0.1:** a native icon set, mobile support, client-brand themes beyond the contract, a public documentation site, a license, or coverage of all 101 registry entries.

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
S0 truthful baseline ──▶ S4 contracts ──▶ S5 @stylos/ui ──▶ S6 proof ──▶ v0.1
```

**Three stages are gone.** The foundations are confirmed and the registry is readable, so S1 and S2 are behind. S3 — tokens to CSS — was a week of output with no reader: custom properties can only be proved by something rendering with them, and that something is the package. It is now the first step of S5. Stage numbers are kept as they were so that references elsewhere still resolve.

The long pole is now **S4**: twenty-nine component contracts, each needing judgement that cannot be batched — cut into six waves, each ending in something that renders.

---

## 4. Stages

### Stage 0 — Make the repository truthful

**Why first:** every later stage builds on what the repository asserts. Where it asserts something false, the cost compounds.

- Make the installed skill build identifiable. Figma does not carry the `metadata` block, so a version cannot round-trip on its own — but it carries `description`. `tools/build-skills.mjs` appends each source's `metadata.version` to its description at compile time, so the loaded build names itself. Injected by the build, never typed: a hand-written version is wrong from the moment the file changes without it.

**Gate:** nothing in the repository is known to be false.
**Estimate:** under a week.

---

### Stage 4 — Component contracts for the core set

**Scope discipline:** 38 registry entries, not 101 — the set the proof screen needs. Two of them, `Button Outline` and `Button Ghost`, do not exist in the registry yet and are created here.

**The Airtable `import.batch` numbers are not this queue.** They are history from the one-time bootstrap of 2026-08-20, and `registry/README.md` keeps them as history for that reason. Read as a plan they mislead: batch 1 held 45 entries spanning all five levels, 18 of them outside this set, while Tooltip, Toast and Side Panel — named by the Stage 6 gate or by this set — sat in batch 2. Nothing below writes back into that field.

**The set, in the order it is worked.** A wave is defined by what it lets you build, not by level or by size, and it is capped at four entries so that it closes.

| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Primitives and selection controls | Badge, Label, Loader, Indicator Status, Indicator Special, Button Inner, Link, Checkbox Input / Label / Text, Radio Input / Label / Text | a form column that renders from the library alone | 1 wk |
| 2 | The remaining small elements | Icon, Tag Fill / Outline, Toggle Input / Label / Text | a filter row | 1 wk |
| 3 | The table | Table Cell Heading, Table Cell Text, Table Row Head, Table Row Body, Table | a dense table carrying real data | 1–2 wk |
| 4 | Input | Input Text, Select, Dropdown Item Default / Parent / Checkbox / Toggle, Dropdown | a toolbar and filters above that table | 1 wk |
| 5 | The Button family | Button / Button Basic, Button / Button Outline, Button / Button Ghost, Button Icon | every action on the screen | 2 wk |
| 6 | The shell | Modal, Side Panel, Tooltip | the Stage 6 proof screen, composed | 1 wk |

**Build the proof screen incrementally, as each wave lands** — in Figma, from the library, without waiting for Stage 6. A wave that ends in a rendered fragment finds the gap it opened within days; a wave that ends in a merged YAML file finds it in Stage 6, where it costs a re-cut of the set.

**Figma readiness is inside the wave, not a precondition of it.** Table, Side Panel and Tooltip are not ready in the library today. That work belongs to waves 3 and 6 and is priced into them; it is not a survey to run ahead of the stage.

**Wave 5 is not four contracts.** Figma holds three sets of 100 variants under `Button / Button Basic | Outline | Ghost` with an identical API; `tone` carries `error` against [`naming.md`](docs/foundations/naming.md) §4 in all three; two of the three have no registry entry; the ids do not match the Figma names the way `Table Cell Text` does; and the change making `do_not_use_when.instead` take a list is blocked until Outline and Ghost exist to anchor to. It is one reconciliation, done once, across the family.

**Out of v0.1, deliberately:** Toast, Tabs Horizontal and Tabs / Tab Item — the Stage 6 gate names a table, filters, a side panel and a modal, and none of the three appears in it. Everything else follows them, grouped in §9.

- **First**, settle the documentation boundary — which of `STANDARD.md`'s twenty points live in Figma and which in Markdown. Writing twenty documents before that rule exists guarantees rewriting them.
- Decide the accessibility target and browser baseline. A contract records accessibility findings against the thing each is about, so the target they are judged by cannot wait for Stage 5.
- Decide the depth of component-specific tokens.
- **Review the skill set before running any of it**: what each remaining skill is for, what to repair, whether it is detailed enough to be followed. `text-sizing` is already gone; `component-integrity-check` and `naming-cleanup` both carry text that predates `docs/foundations/`. A skill that runs on a stale contract writes the stale contract into the library.
- Run `stylos-component-integrity-check` over the set and **fix findings in Figma before documenting** — otherwise the defect gets written down as the contract.
- Move every `tone=error` to `tone=danger` as each set is worked through, and drop `neutral` and `info` where they appear. Which sets carry them is only visible in Figma; recording it per component is part of this stage, not a survey to run ahead of it.
- Write the contracts, extending each registry entry rather than starting a second file.
- **Write each component's Figma description while documenting it** — one line of what it is for, one of what it is not for, and where it normally lives if it is used inside another component. It is composed from `summary`, the first `use_when` and the first `do_not_use_when` rather than authored ([`registry/README.md`](docs/components/registry/README.md)), and it is the only thing besides the name that an agent searching the library can learn about a component. Whether it measurably improves `reference-reconstruction`'s mapping is untested; the description earns its place for a designer browsing the Assets panel either way.

**Gate:** every core component has a contract meeting the standard, passes the integrity check, and records its Figma node.
**Estimate:** 6–8 weeks.

---

### Stage 5 — `@stylos/ui`

**First, generate the CSS** — what used to be Stage 3, moved here because its output has no reader until something renders with it:

- `tokens/*.yaml` → CSS custom properties, preserving the primitive/semantic indirection so palette overrides propagate.
- One deterministic, documented rule for token name → custom property name.
- Mode scoping per [`color.md`](docs/foundations/color.md): palette emitted flat and unscoped; the semantic layer emitted once per mode with every role declared in both; one global switch.
- The slot layer emitted as its own indirection, so a client rebrand is five bindings rather than 110 overrides.
- Shadows composed per [`effects.md`](docs/foundations/effects.md) — cumulative stacks, not one layer per level.
- Fail on a token that disappeared between runs without acknowledgement.

**Then the package itself. Planned approach**, not yet committed — revisit when the work actually starts:

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
| S4 — component contracts | 6–8 wk | 9 wk |
| S5 — `@stylos/ui`, CSS included | 11–13 wk | 22 wk |
| S6 — proof + docs | 4 wk | **26 wk** |

**≈ 6 months.** The total has not moved: the CSS week did not disappear, it moved next to the thing that consumes it. Two stages before it shrank on inspection rather than on optimism, and both are behind. Foundations was budgeted at 6–8 weeks and cost days, being mostly ratification of what Figma already held. S2 was four weeks of automated registry↔Figma reconciliation whose only consumer exists nowhere; what the registry actually needed was to be readable, and that took a day. Treat any plan promising v0.1 sooner at this budget as having cut a gate rather than found efficiency.

**Scope levers, in the order to pull them:**

1. Ship wave 5 as `Button Basic` alone, leaving Outline and Ghost undocumented, and drop Tooltip from wave 6. Saves ~2 weeks across S4 and S5. Side Panel, Modal and the table are named by the gate and are not available to cut.
2. Ship the documentation surface as rendered Markdown instead of Storybook. Saves ~2 weeks in S6.
3. Defer component-token depth by adopting "no component-specific tokens" as the provisional answer. Saves ~1 week.

Do **not** pull: the integrity check before documenting, the documentation-boundary decision before writing documents, or the proof screen.

---

## 6. Open questions, and where each is answered

| Question | Stage |
| --- | --- |
| Skill set — purpose, repairs, what to drop | 4 |
| `tone` values that have no colour behind them | 4 |
| Component parameters — where the contract records them | 4 |
| Token name → CSS custom property mapping | 5 |
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
| S4 stalls — twenty-nine contracts of judgement work | two sessions on the same component | §2.2: adopt what Figma does, write it down as provisional. The wave's rendered fragment is the forcing function |
| Completionism against the 101-entry registry | documenting outside the core set | the Stage 4 table is the scope |
| The registry drifts from Figma unnoticed | `validate:registry` not run for weeks | make it part of the pre-commit habit |
| Documentation drifts from the built system | a document describing something that no longer exists | keep facts in one place; documents point rather than copy |
| The proof screen gets skipped as "obvious" | v0.1 tagged without S6 | it is the gate |

---

## 8. Explicitly not in this plan

A native Stylos icon set (Material Symbols stays interim), mobile support, writing to Figma from the repository, an Airtable sync, a public documentation site, and any licensing or commercial work.

---

## 9. After v0.1 — the milestones

The vocabulary — what a milestone is, how it differs from a release and from a wave, and why neither lives on a registry entry — is [`ARCHITECTURE.md`](ARCHITECTURE.md) §8. This section is the content: which decision waits on what.

Two consequences worth restating where they apply. **A milestone is not a size budget**: putting more into one moves the decision later, it does not make the milestone wrong. And **waves do not stop at v0.1** — §4's numbering is continuous, so when v0.1 closes, alpha's checklist is cut into waves 7, 8, 9 and §4 grows. There are no waves inside a milestone here because there is nothing to cut yet.

| Milestone | The decision it opens | Entries |
| --- | --- | --- |
| alpha | the decision that the library is ready for **internal distribution** — someone other than the author builds on it | Input Color, Input Date, Input Datetime, Input Email, Input Number, Input Password, Input Search, Input Telephone, Input Time, Input URL, Text Area, Multiselect, Select Cascade, Date Picker, Slider, Chips, Uploader, Queryfield, Progress, Avatar, Image, Table / TD Actions, Table / TD Boolean, Table / TD Checkbox, Table / TD Expand, Table / TD Image, Table / TD Link, Table / TD Person, Table / TD Tags, Table / TH Checkbox, Table Toolbar, Pagination, Button Group, Button Dropdown, Breadcrumbs, Tabs Horizontal, Tabs / Tab Item, Tabs Vertical, Switcher, Scrollbar, Accordion, Accordion / Container, Accordion / Header |
| beta | the decision that it is ready **outside** — a product that is not ours, with the states a real screen has and an API that will not move under it | Toast, Alert, Popover, Skeleton Loader, Data Info, Metric, Card, List, Tree, Person, Event, Asset, Logo, Feature List, Hero, Code Snippet, Charts, Header, Side Panel Menu, Steps, Flex Layout, Tag Interactive Fill, Tag Interactive Outline, Table Cell Multiline |
| 1.0 | the decision that the library is **complete and its API is a commitment** | Code Editor, Code Editor / Text Area, Code Editor / Toolbar, Edit Mode / Edit, Edit Mode / View, Audio Player, Video Player, Carousel |
| Parked | no decision waits on these — mobile, which this plan excludes (§8 above) | Bottom Sheet, Pull to Refresh |

**Both tables are read, not copied.** `tools/lib/plan.mjs` parses §4 and this one on every build, so the views show the road this document states and no other — the registry index as a **Milestone** column and a **Wave** column, each with its own facet, and the home page as two charts and a sentence saying which milestone and which wave the work is in. The milestone bars are all full width and only their fill differs: a milestone is a checklist, not a quantity of work, and drawing 43 against 8 would say otherwise. `Parked` is not charted, because no decision waits on it. The `Entries` column is therefore written as full registry ids — the only shorthand either table takes is `Radio Input / Label / Text`, which expands through the entry's `family`. An id named in either table that the registry does not hold fails the build; an entry named by neither is reported by `npm run validate:registry`, so the queue cannot quietly cover part of the set.

Four notes, so they are not re-derived later:

- **A big layout component is worth less in a library than its size suggests.** Header and Side Panel Menu are assembled once per product and usually assembled by hand; being in the library early buys little. That is why they sit in beta while much smaller things — Steps, Switcher — sit above or beside them. Hero and Bottom Sheet are the same class of component, and Hero is in beta on that reasoning rather than on its own merits.
- **The ten `Input *` entries read as one API repeated with a different type.** If that holds when the family is opened in Figma, alpha's checklist is much shorter than its count — nine of those entries would be the same contract written once. That is inference from the registry, where the ten are identical in level, role and size; it has not been checked against the library.
- **Avatar and Image sit with the table cells** because every cell type names them, not because they belong to the table.
- **Toast, Tabs Horizontal and Tabs / Tab Item were cut from v0.1** rather than never wanted.
