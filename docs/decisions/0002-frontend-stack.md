# 0002 — Frontend stack: Svelte 5, TypeScript, Zag.js for behaviour

**Status:** Accepted
**Date:** 2026-09-06

## Problem

The second half of [`PLAN.md`](../../PLAN.md) Stage 5 is opening: the CSS build landed, and `@stylos/ui` is next. The package's stack has to be fixed before the first component is written, because every component is written against it — the way behaviour is expressed decides how each contract's `api` and `a11y` blocks turn into code, and reversing the choice later rewrites the package rather than adjusting it.

Until now the stack lived in `PLAN.md` Stage 5 as a planned approach: Svelte committed on 2026-09-04, Melt UI named as the leading candidate for behaviour, the rest marked "revisit when the work actually starts". The work is starting; this is the revisit. It becomes a record — the first since the purge of 2026-08-23 — because it now meets the bar [`README.md`](README.md) sets: expensive to reverse, and exactly the kind of choice that gets re-opened every few weeks unless it is argued once and written down.

## Constraints already set

- **Svelte is committed** (2026-09-04, `PLAN.md` Stage 5). This record does not reopen the framework question; it fixes the version model — Svelte 5, runes — because a package started in 2026 on the previous component model would be born legacy.
- **Plain CSS + custom properties** for component internals, no build-time styling dependency (`PLAN.md` Stage 5). Nothing chosen here may bring a styling system with it.
- **Anatomy, layer names and DOM structure are authored by Stylos** ([`naming.md`](../foundations/naming.md)). A behaviour supplier that ships its own markup is disqualified before evaluation, not weighed.
- **Props map 1:1 onto Figma variant properties**; divergence is a defect in one side, not a translation detail ([`naming.md`](../foundations/naming.md)).
- **Solo maintainer.** Hand-writing all interaction accessibility is too much surface to get right alone — already settled in `PLAN.md` Stage 5, restated here because it is the reason a behaviour library exists in this stack at all.

## Options considered

1. **Melt UI** — the candidate `PLAN.md` carried. It satisfies the hard constraint: builders only, no markup shipped. Rejected on two grounds that only became decisive when the choice stopped being provisional. Its behaviour is written inside Svelte's reactive model, so the logic is inseparable from the one framework consuming it — testable only by rendering, portable to nothing else. And at the moment of choosing, its Svelte 5 story was a rewrite in progress: starting a package on either the pre-runes original or the mid-flight successor means betting the interaction layer on a transition that is not ours.
2. **Component libraries that ship structure** (Bits UI and its class). Rejected on the standing constraint alone: a library with its own anatomy means working around its structure instead of authoring ours, which conflicts with the naming rules already in force.
3. **Hand-written behaviour.** Rejected in `PLAN.md` before this record and not reopened: a solo maintainer hand-rolling focus management, typeahead, dismissal layers and ARIA wiring for a dropdown, a modal and a tooltip is the accessibility surface this stack exists to not carry alone.
4. **Zag.js** (adopted) — behaviour as framework-agnostic finite state machines, consumed through a Svelte adapter. Each machine supplies state, transitions and ARIA wiring as collections of props that are spread onto elements Stylos authors; it renders nothing and names nothing in the DOM.

## Decision

**Svelte 5** with runes, **TypeScript** throughout, **Zag.js** for behaviour.

Why Zag over the candidate it replaces, given that both leave anatomy to us:

- **The behaviour is a machine, not a reactive graph.** A state machine is inspectable and testable without rendering a component, and its transitions can be read against a contract's states the way the integrity check reads a Figma variant set. Behaviour written inside a framework's reactivity can only be observed through that framework.
- **The engine is framework-agnostic; only the adapter is Svelte.** This repository already holds one contract binding more than one implementation — Figma and this package ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §1). A behaviour layer with the same shape costs nothing extra now and means a future non-Svelte consumer reuses the machines rather than the rewrite.
- **The maintenance base is wider than one framework's community.** Zag underpins an ecosystem serving several frameworks at once; its coverage of the widgets the core set needs — dialog, tooltip, menu, select, the input family's controls — exists today rather than being promised.

TypeScript is in the decision, not an implementation detail: the 1:1 prop ↔ variant property mapping is a claim that should fail at compile time, not only in a review table. A registry entry's `api` block becomes a typed prop surface, and a prop that drifts from it breaks the build rather than the reader.

## Consequences

- Every interactive component in `@stylos/ui` is a Zag machine plus Stylos-authored markup plus the generated custom properties. Non-interactive primitives take no behaviour dependency at all.
- **Where a machine's ARIA decisions and a contract's `a11y` block disagree, the contract wins** — same rule as for Figma: an implementation that genuinely cannot comply declares the divergence in the contract with a reason, and an undeclared divergence is a defect.
- Zag's idiom is prop-spreading, not Svelte actions. The package's internals will read as Zag-flavoured Svelte rather than idiomatic-first Svelte; accepted as the price of the machine model.
- The dependency surface is many small `@zag-js/*` packages that version together. They are pinned and moved deliberately, per machine, not floated.
- Melt UI stops being named anywhere as a candidate. `PLAN.md` Stage 5 and [`naming.md`](../foundations/naming.md) now point at this record instead of carrying the reasoning.

## Follow-up

- Scaffold `@stylos/ui` per `PLAN.md` Stage 5; the scaffold gets its own work order in [`docs/specs/`](../specs/README.md) when it is built, as anything built does.
- The first wave of components (primitives, per the registry's `children` order) needs no machine; the first machine lands with the first interactive element, and that is where this decision meets reality. If it forces a fight with a contract there, amend this record's banner rather than its body.
