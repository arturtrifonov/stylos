# Stylos — Execution plan

How the project gets from `0.1.0` to a version an agent can build a real product screen from, which release marks each step, and what each release puts in a consumer's hands.

**This plan carries sequence, gates and estimates — not status.** What is done is answered by the repository and by git, never by a checkbox here. A plan that also tracks state has to be edited every time work lands, and then it rots between edits like any document that copies facts living elsewhere. This one changes when the *order* or the *destination* changes, which is rare and worth noticing.

Not normative. Rules live in [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`docs/foundations/`](docs/foundations/README.md); they win on any conflict. Things to be built get a work order in [`docs/specs/`](docs/specs/README.md).

**Baseline:** pre-alpha · solo owner · 5–10 h/week · `0.1.0` cut 2026-09-05

---

## 1. The release ladder

Two tags remain, each a decision about distribution rather than a percentage of work done, and each with a gate that can be checked rather than judged.

| Tag | The decision it makes | Cut at |
| --- | --- | --- |
| `0.2.0` | the system renders — `@stylos/ui` builds the core set from the generated tokens | end of S5 |
| `0.3.0` | the system is proved — a dense screen is built from Stylos by an agent, not by its author | end of S6 |

`0.1.0` made the first of these decisions — the contracts for the core set are fixed and the Figma library implements them — and was cut on 2026-09-05. Its gate is [SPEC 0006](docs/specs/0006-versioning-and-release-0-1-0.md) and its notes are in `CHANGELOG.md`; neither is restated here.

All three fall inside the `0.1` milestone, whose checklist is §4.1. The versioning rules are [`ARCHITECTURE.md`](ARCHITECTURE.md) §9.

### `0.2.0`

| # | Requirement | Verified by |
| --- | --- | --- |
| 1 | `@stylos/ui` builds and renders every documented variant of the core set | the workshop build |
| 2 | Every component's props are exactly its entry's `api` under [SPEC 0009](docs/specs/0009-stylos-ui-package.md) §3 | the compiler, against generated `props.ts` |
| 3 | No value outside `tokens.css` — no hex, no raw `px` | Stylelint |
| 4 | The component CSS is consumable without Svelte | the export resolves and renders in a plain HTML page |

### `0.3.0`

| # | Requirement | Verified by |
| --- | --- | --- |
| 1 | One dense, real product screen exists twice — in Figma and in code — built entirely from Stylos, with no local overrides in either | the screen |
| 2 | **The code half is built by an agent from the published artifacts alone, without access to this repository** | the transcript, and the screen |
| 3 | It contains no hardcoded colour, size or spacing | the lint rule |

**Requirement 2 is the gate this plan is now written around.** It is the only test that exercises the whole chain at once — tokens consumable, contracts complete enough to configure a component from, the artifacts self-sufficient — and it is the only way to find out whether the missing knowledge is in the artifacts or in the author's head. Built by hand, the screen always looks fine.

It replaces the earlier phrasing, which assumed a person doing the building. The bar did not move; who holds the tools did, because the stated consumer on this horizon is the owner and the coding agents he runs ([ADR 0002](docs/decisions/0002-frontend-stack.md), *Constraints already set*).

**Not required for either:** a native icon set, mobile support, client-brand themes beyond the contract, a public documentation site, a licence, a distribution channel, or coverage of all 114 registry entries.

---

## 2. What each release puts in a consumer's hands

Everything below is generated from `tokens/` and the registry, or authored once. **A row leaves this table and joins [`ARCHITECTURE.md`](ARCHITECTURE.md) §3 the moment the thing exists** — that document describes what is, this one what is not yet, and neither carries the other's rows.

| Artifact | Built by | Lands in | Committed | Consumer | Release |
| --- | --- | --- | --- | --- | --- |
| Svelte components | `svelte-package` | `packages/ui/dist/package/` | no | Svelte applications | `0.2.0` |
| The workshop | Storybook | `apps/workshop/` | no | the frontend developer — behaviour and states | `0.2.0` |
| `registry.json` — the contracts machine-readable, with the unimplemented marked as such | a generator in `tools/` | `packages/ui/dist/` | no | an agent choosing a component | `0.3.0` |
| The consumer skill — how to build a screen on Stylos | authored once | `packages/ui/skill/` | yes | an agent in any tool | `0.3.0` |
| The Stylelint config | authored once | `packages/ui/` | yes | the consumer's own lint run | `0.3.0` |
| The design-system bundle — one preview per component, `@dsCard` markers | a generator in `tools/` | `packages/ui/dist/design-system/` | no | Claude Design | `0.3.0` |
| Code Connect files | a generator in `tools/`, from `api` and `figma.node_id` | `figma/code-connect/` | yes | Figma MCP | alpha |

`tokens.css` and `tokens.json` are absent from this table because they exist — they are `ARCHITECTURE.md` §3 rows already.

**Three properties hold across every row, and they are what makes the set coherent rather than seven separate outputs:**

1. **One markup.** The Svelte wrapper adds nothing to the DOM beyond the class and the data attributes the CSS reads, so a preview, a Claude Design artboard and the rendered component are the same HTML. A design lifts into code without being redrawn.
2. **Authored once.** Per component, three files are written by hand — `<name>.css`, `<Name>.svelte`, and a behaviour when it needs one. Everything else in the table is a projection, so adding a component does not add a surface to keep in sync.
3. **Only the implemented is exported.** `registry.json` marks the rest as not existing. Without that an agent reads a name it cannot build and invents an API for it, which is the single way to lose everything the contracts buy.

**The distribution channel is not decided here.** Whether the package reaches a consumer by public npm, a private registry, a git dependency or a tarball depends on the licence, which is an alpha question (§6). The package stays `private` and is consumed as a git dependency until then; nothing above changes when the channel does.

---

## 3. Operating principles

1. **Contract before its component.** A component's `api` is corrected to describe the web component in the same session its `.svelte` is written — per component, never as a sweep ([ADR 0002](docs/decisions/0002-frontend-stack.md), [SPEC 0009](docs/specs/0009-stylos-ui-package.md) §5).
2. **Every open question is time-boxed to one session.** Solo projects stall on decisions, not on work. If a question cannot be reasoned to a conclusion in one sitting, the conclusion is "adopt what the system already does, write it down as provisional, move on."
3. **A stage is not finished until its gate passes.** Gates are mechanical where possible — a command exits 0 — rather than a judgement call.
4. **Scope is cut from breadth, never from the gate.** If time runs short, fewer components — not a partially built one.
5. **Generated output is never authored.** A file a generator can write is a file nobody edits.

---

## 4. Stages

### 4.1 The core set

The `0.1` milestone's checklist, and the membership record for every entry the waves cover. It is read by `tools/lib/plan.mjs` on every build, never copied ([`ARCHITECTURE.md`](ARCHITECTURE.md) §8), which is why it stays here now that the work behind it is done: nothing else records which entries belong to `0.1`, and an entry named by neither this table nor §9 is reported by `npm run validate:registry`.

| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Primitives and selection controls | Badge, Label, Loader, Indicator Status, Indicator Special, Button Inner, Link, Checkbox Input / Label / Text, Radio Input / Label / Text | a form column that renders from the library alone | 1 wk |
| 2 | The remaining small elements | Icon, Tag Fill / Outline, Toggle Input / Label / Text | a filter row | 1 wk |
| 3 | The table | Table Cell Heading, Table Cell Text, Table Row Head, Table Row Body | a dense table carrying real data | 1–2 wk |
| 4 | Input | Input Text, Select, Dropdown Item Default / Parent / Checkbox / Toggle, Dropdown | a toolbar and filters above that table | 1 wk |
| 5 | The Button family | Button Base, Button Outline, Button Ghost, Button Icon Base, Button Icon Outline, Button Icon Ghost | every action on the screen | 2 wk |
| 6 | The shell | Modal, Drawer, Tooltip | the Stage 6 proof screen, composed | 1 wk |

*Amended 2026-09-07:* **Tooltip was built out of order**, ahead of the seven elements still open in wave 1 and the rest of wave 2 — the owner chose it explicitly. The table is a sequence rather than a gate, and nothing in it depends on the order being kept: the waves are grouped by what a screen needs next, not by what compiles after what. Wave 6's other two entries, Modal and Drawer, are untouched.

The same six waves order the package's work in §4.2 — a component is implemented in the wave that wrote its contract, so the dependency order is already cut.

### 4.2 Stage 5 — `@stylos/ui`

The work order is [SPEC 0009](docs/specs/0009-stylos-ui-package.md); the stack and the layering are [ADR 0002](docs/decisions/0002-frontend-stack.md). What assembles into what:

```
tokens/*.yaml ─────────────tokens:css───────▶ packages/ui/dist/tokens.css
                                              packages/ui/dist/tokens.json

registry/*.yaml ──┬──build-ui-types────────▶ packages/ui/src/components/<name>/props.ts
                  └──build-ui-stories──────▶ apps/workshop/  (one story, a case per variant)

authored ─────────── packages/ui/src/components/<name>/<name>.css
                     packages/ui/src/components/<name>/<Name>.svelte
                     packages/ui/src/behaviors/<pattern>.ts
                                    │
                                    └───svelte-package───▶ packages/ui/dist/package/
```

`ui:generate` runs the two generators after `tokens:css`; `ui:build` runs the package build with generation as its `prebuild`. Everything under `dist/` is gitignored and rebuilt.

Work:

- Implement in the slice order of [SPEC 0009](docs/specs/0009-stylos-ui-package.md) §7 — Badge, Checkbox Input, Tooltip, Modal/Drawer, Dropdown, Select, the table, Button ×6. The first two are the pace test: after them the estimate below meets a real line of the package for the first time.
- Correct each component's `api` as its contract is opened, per §3.1.
- Add the independent CSS export to `packages/ui/package.json` — per component plus an aggregate, so a preview links one file and an application pulls only what it uses.
- Stylelint, Vitest browser mode, Playwright for keyboard behaviour, axe on every story, all into the CI of [SPEC 0008](docs/specs/0008-development-and-release-flow.md).

**Gate:** the `0.2.0` table in §1.
**Estimate:** 10–12 weeks.

### 4.3 Stage 6 — the proof, and the consumer surface

**Why:** the `0.3.0` gate itself. Nothing before this has been validated by anything but its own tests.

The two generators this stage adds:

```
registry/*.yaml ──build-registry-json──▶ packages/ui/dist/registry.json
registry/*.yaml + <name>.css ──build-previews──▶ packages/ui/dist/design-system/<name>/index.html
                                                 (first line: <!-- @dsCard group="…" -->)
```

Work:

- Build the two generators, and author the consumer skill — what exists, how to derive a contract's address from a component name, what is forbidden, which commands verify the result.
- Build one dense screen — table view with filters, side panel, modal — in Figma from the library.
- **Hand an agent the published artifacts and nothing else, and have it build the same screen.** Log every question it could not answer from them. Those are the gaps, and they outrank any remaining open question as `0.3.1` input.
- Sync the design-system bundle into a Claude Design project, one component at a time as previews land.
- Tag `0.3.0`; write release notes against the `0.3.0` gate.

The card group in a preview is the entry's `level` or `role` — both are filled on all 114 entries, so nothing new is authored to group them.

A preview is static: a Zag machine does not run in it, so an open menu or a visible focus ring renders from forced data attributes. That is a requirement on the generator, and it is why the pattern components' previews cost more than the primitives'.

**Gate:** the `0.3.0` table in §1.
**Estimate:** 5 weeks.

---

## 5. Schedule

At 5–10 h/week, from 2026-09-06:

| Stage | Estimate | Cumulative | Cuts |
| --- | ---: | ---: | --- |
| S5 — `@stylos/ui` | 10–12 wk | 12 wk | `0.2.0` |
| S6 — proof + consumer surface | 5 wk | **17 wk** | `0.3.0` |

**≈ 4 months.** S6 carries a week more than it did: the two generators and the skill are new, and the agent-built half of the proof screen replaces the hand-built one rather than adding to it.

**Scope levers, in the order to pull them:**

1. Implement `Button Base` alone in S5, leaving Outline and Ghost to alpha, and drop Tooltip from the proof screen. Saves ~2 weeks. Drawer, Modal and the table are named by the gate and are not available to cut.
2. Ship the design-system bundle after `0.3.0`. It serves scenario 2 and gates nothing; the tag does not wait on it.

Do **not** pull: the consumer skill or `registry.json` — requirement 2 of the `0.3.0` gate is unpassable without them — or the proof screen.

---

## 6. Open questions, and where each is answered

| Question | Where |
| --- | --- |
| Dropdown's ARIA model — menu or listbox | component backlog, at its slice |
| `disabled` contrast against 3:1, system-wide | a colour decision, before the components that carry it |
| Which AAA criteria the system knowingly will not meet | listed once S5's axe runs measure them |
| Component-specific token depth | provisional "none" ([SPEC 0007](docs/specs/0007-tokens-to-css.md) §9) until a component needs one |
| Licence, and the distribution channel that depends on it | alpha |

**Deliberately unanswered before `0.3.0`:** the project's public contact details, responsive breakpoints (desktop-only scope makes them premature), automated skill installation, and React or any other framework adapter — the layering allows one and nothing asks for it.

**A Stylos Figma plugin is intended**, and the reason is ergonomic rather than technical: it removes the manual export and the JSON handling from the loop entirely, and opens the direction of authoring the palette outside Figma. Its scope and timing are open, not its existence. It is not on the critical path — the current pipeline works — so it is scheduled when the manual step becomes the thing slowing the week down.

---

## 7. Risks

| Risk | Signal | Countermeasure |
| --- | --- | --- |
| The S5 estimate is untested against real pace | slices 1–2 take materially longer than a week each | re-price after them rather than at the end |
| A Zag machine is the wrong shape for a contract | two sessions on one pattern component | [ADR 0002](docs/decisions/0002-frontend-stack.md)'s revisit clause: behaviour by hand for that component, recorded in its contract |
| The consumer artifacts are written by hand and drift | a preview or a `registry.json` edited rather than regenerated | they are generators or they are not built |
| The proof screen gets skipped as "obvious" | `0.3.0` tagged without S6 | it is the gate |
| The agent-built half quietly becomes author-assisted | hints supplied mid-run and not logged | every question the agent could not answer from the artifacts is written down; that log is the deliverable |

---

## 8. Explicitly not in this plan

A native Stylos icon set (Material Icons stays interim — Google's older set, not Symbols; [`icons.md`](docs/foundations/icons.md)), mobile support, writing to Figma from the repository, framework adapters beyond Svelte, and any licensing or commercial work.

*Amended 2026-09-06:* a public documentation site was on this list and is no longer — the owner decided, explicitly, to publish the generated tree with the workshop inside it. [SPEC 0011](docs/specs/0011-project-website.md) is the work order; the deploy itself stays a manual act outside the plan.

---

## 9. After the core set — the milestones

The vocabulary — what a milestone is, how it differs from a release and from a wave, and why neither lives on a registry entry — is [`ARCHITECTURE.md`](ARCHITECTURE.md) §8. This section is the content: which decision waits on what.

**A milestone is not a size budget**: putting more into one moves the decision later, it does not make the milestone wrong. And **waves do not stop at the core set** — §4.1's numbering is continuous, so when the `0.1` milestone closes, alpha's checklist is cut into waves 7, 8, 9 and §4.1 grows.

| Milestone | The decision it opens | Entries |
| --- | --- | --- |
| alpha | the decision that the library is ready for **internal distribution** — someone other than the author builds on it | Input Color, Input Date, Input Datetime, Input Email, Input Number, Input Password, Input Search, Input Telephone, Input Time, Input URL, Text Area, Multiselect, Select Cascade, Date Picker, Slider, Chips, Uploader, Queryfield, Progress, Avatar, Image, Table Cell Actions, Table Cell Boolean, Table Cell Checkbox, Table Cell Expand, Table Cell Image, Table Cell Link, Table Cell Person, Table Cell Tags, Table Cell Heading Checkbox, Table Toolbar, Pagination, Button Group, Button Dropdown, Breadcrumbs, Tabs Horizontal, Tab Item, Tabs Vertical, Switcher, Scrollbar, Accordion, Accordion Header |
| beta | the decision that it is ready **outside** — a product that is not ours, with the states a real screen has and an API that will not move under it | Toast, Alert, Popover, Skeleton Loader, Data Info, Metric, Card, List, Tree, Person, Event, Asset, Logo, Feature List, Hero, Code Snippet, Charts, Header, Side Panel Menu, Steps, Flex Layout, Tag Interactive Fill, Tag Interactive Outline, Table Cell Multiline |
| 1.0 | the decision that the library is **complete and its API is a commitment** | Code Editor, Code Editor Text Area, Code Editor Toolbar, Edit Mode, Audio Player, Video Player, Carousel |
| Parked | no decision waits on these — mobile, which this plan excludes (§8) | Bottom Sheet, Pull to Refresh |

**Both tables are read, not copied.** `tools/lib/plan.mjs` parses §4.1 and this one on every build, so the views show the road this document states and no other. The `Entries` column is written as full registry ids — the only shorthand either table takes is `Radio Input / Label / Text`, which expands through the entry's `family`. An id named in either table that the registry does not hold fails the build; an entry named by neither is reported by `npm run validate:registry`.

Three notes, so they are not re-derived later:

- **A big layout component is worth less in a library than its size suggests.** Header and Side Panel Menu are assembled once per product and usually by hand; being in the library early buys little. That is why they sit in beta while much smaller things — Steps, Switcher — sit above or beside them. Hero is the same class of component.
- **The ten `Input *` entries read as one API repeated with a different type.** If that holds when the family is opened, alpha's checklist is much shorter than its count. That is inference from the registry, where the ten are identical in level, role and size; it has not been checked against the library.
- **Avatar and Image sit with the table cells** because every cell type names them, not because they belong to the table.
