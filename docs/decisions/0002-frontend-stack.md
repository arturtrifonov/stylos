# 0002 — Frontend stack: Svelte 5, TypeScript, Zag.js for behaviour

**Status:** Accepted
**Date:** 2026-09-06

## Problem

Stage 5 opens the code package, `@stylos/ui`. `PLAN.md` carried a planned approach — Svelte, Melt UI, plain CSS — and it was re-opened twice: on 2026-09-04 (Svelte committed, library left open) and on 2026-09-05, when the question underneath surfaced in plain words: *is a behaviour library needed at all?* If not, writing components by hand in Svelte is the pleasant path. If it is, React has the larger ecosystem to find one in. The two branches lead to different frameworks, so the framework cannot be fixed before the behaviour question is.

Answered on the wrong population once already: judged against the 39 core components, a library looks unnecessary, because the core set was chosen as the simplest components a first screen needs. The answer has to hold for the registry as a whole — 114 entries, 75 of them queued ([`PLAN.md`](../../PLAN.md) §9), and that is where the date picker, the combobox, the tree, the toast and the slider live.

## Constraints already set

- The contract is authored in the registry and implemented twice; anatomy, layer names and property names are Stylos's ([`docs/components/README.md`](../components/README.md), [`naming.md`](../foundations/naming.md)). A library that renders its own DOM works against that.
- Component internals are plain CSS on custom properties, the same properties a consumer themes with ([`PLAN.md`](../../PLAN.md) Stage 5). No build-time styling dependency.
- The consumer on the `0.2.0`–`0.3.0` horizon is the owner and the coding agents he runs. The owner reads HTML, CSS and Svelte templates and verifies them; React hooks he does not. Verifiability by the person who signs off is a criterion, not a taste.
- Solo, 5–10 h/week. Accessibility surface written by hand does not get re-tested by anyone else.
- Props map 1:1 onto the contract's `api` ([`PLAN.md`](../../PLAN.md) §1, `0.2.0` gate). Whatever supplies behaviour sits under that surface, never on it.

## What the registry needs

Every entry classified by where its behaviour comes from (2026-09-06):

| Class | Count | Examples |
| --- | ---: | --- |
| static — no behaviour | 37 | Badge, Label, Loader, Indicator, Icon, Card, Header, Table Cell Tags |
| native — the element supplies it | 31 | Button ×6, Link, Checkbox Input, Radio Input, `Input *`, Text Area, Table Row |
| pattern — a WAI-ARIA APG model beyond the element | 46 | Dropdown and its items, Select, Multiselect, Date Picker, Tooltip, Modal, Drawer, Tabs, Accordion, Tree, Toast, Slider, Chips, Uploader, Carousel, Steps, Switcher, Table Cell Actions |

Forty-six pattern components are some fifteen keyboard models — menu, listbox, combobox, dialog, tooltip, tabs, disclosure, tree, slider, toast, toolbar, toggle group, date grid, tags input, file upload. Written once each by hand, tested by one person: that is the accessibility surface `PLAN.md` Stage 5 refused from the start, and the count confirms the refusal. **A behaviour library is needed.**

## Options considered

Coverage measured against the 46 pattern entries, from each library's own component index, read 2026-09-06.

1. **Svelte 5, behaviour by hand.** Rejected: fifteen APG models, one author, no second tester. Would have been right for the core set alone; the core set is not the system.
2. **React 19 + React Aria hooks.** Behaviour only, the owner writes every element — the same model as option 4. Covers 36/46; the only things it alone covers are Breadcrumbs and the table's sort and selection state, which are attributes rather than patterns. The strongest published accessibility methodology of any candidate. Rejected because the framework fails the verifiability constraint — the person who signs off cannot read what the hooks do — and the coverage advantage that was supposed to justify React does not exist in the numbers.
3. **Svelte 5 + Bits UI.** Covers 26/46 and misses Toast, Tree, Chips, Uploader, Drawer, Steps. Renders its own elements by default; the `child` snippet hands the element back, but the default is the wrong way round for a system that authors its anatomy. Rejected.
4. **Svelte 5 + Zag.js** (adopted). State machines plus prop getters, no DOM of its own — the anatomy stays authored here and the machine's props are spread onto it. Covers 36/46, the same as React Aria; alone covers Carousel, Editable, Cascade Select, Steps. Adapters for Svelte, React, Vue and Solid, so the behaviour layer is not what ties the system to Svelte — a later framework change would rewrite the wrappers and keep the machines.
5. **Web components (Lit, or Svelte compiled to custom elements).** Rejected: shadow DOM encapsulates styles against a system whose whole styling model is global custom properties, breaks `aria-labelledby` and `for` across the boundary, and has no behaviour library of its own to lean on. Svelte's `customElement` output stays available as a door if a framework-neutral distribution is ever wanted; it is not a plan.

Melt UI, the candidate `PLAN.md` named: its Svelte 5 line (`melt`) has not released since 2026-01-04, covers fewer patterns than Zag, and ships a test package in its runtime dependencies. Superseded by option 4.

None of the three covers Charts, Code Editor, Queryfield or Pull to Refresh. Charts and the editor are external libraries by nature; Queryfield is domain code; Pull to Refresh is parked with mobile.

## Decision

- **Svelte 5** is the framework of `@stylos/ui`.
- **TypeScript**, on one condition: prop types are generated from each entry's `api` and never written by hand. Type files exist for the agent and the compiler; the owner reads templates and CSS. `svelte-package` emits `.d.ts` for consumers either way.
- **Zag.js 1.x** supplies interaction behaviour for pattern components, pinned to the 1.x line until the `2.0` release stabilises. A machine is used where the contract's `requires` findings exceed what the element does natively; a native element or platform feature — `<button>`, `<input>`, `<dialog>`, the Popover API — is used where it satisfies them in every baseline browser ([`accessibility.md`](../foundations/accessibility.md)). Which applies is decided per component when its contract is opened for implementation, and stated in that component's contract.
- **Plain CSS on the generated custom properties** for every visual value; no styling dependency; values outside `tokens.css` are a lint failure.
- **Two surfaces, two audiences.** Storybook is the frontend developer's workshop and the test runner — one story per component, axe on every story. The generated site ([`STANDARD.md`](../components/STANDARD.md)) is the designer's: what a component is for and how it is used. Neither replaces the other.
- **Layered so that the framework is the thinnest layer:** `tokens.css` → per-component CSS keyed on data attributes carrying the contract's values → behaviour (Zag machines, platform) → `.svelte` wrappers exposing the contract's props. Portability lives in the first three layers, not in the choice of the fourth.

Concretely, this changes `PLAN.md` Stage 5 — Melt UI becomes Zag.js, TypeScript is stated, Storybook returns as the documentation surface for developers and scope lever 2 ("rendered Markdown instead of Storybook") is deleted — and the work order is [SPEC 0009](../specs/0009-stylos-ui-package.md).

## Consequences

- The repository stops being dependency-free. Dependencies are confined to `packages/ui`; `tools/` stays as it is.
- Zag brings Floating UI for positioning. Accepted; a component may move to CSS anchor positioning on its own when the baseline allows, machine by machine.
- Zag publishes no screen-reader testing methodology; React Aria does. The gap is covered in the package rather than trusted: axe on every story in CI, keyboard behaviour under Playwright, and a contract finding where automation cannot judge.
- Zag's `2.0` will be a migration. It is a known cost, dated, and confined to the behaviour layer.
- The agent that writes Svelte 5 gets the official tooling: the `sveltejs/ai-tools` plugin for Claude Code, with its autofixer. Recorded in `CLAUDE.md` ([SPEC 0008](../specs/0008-development-and-release-flow.md)).

## Revisit when

- The intended consumer becomes "agents in any tool" rather than this owner and his agents — the framework-neutral question returns, and the layering above is what makes it answerable cheaply.
- A pattern component cannot be built on its Zag machine within two sessions — the machine is the wrong shape for the contract, and that component gets its behaviour by hand or from another source, recorded in its contract.
- Zag `2.0` ships and the 1.x line stops receiving fixes.
