# docs/components/

One Markdown file per public component. The path mirrors the registry's: `Icon Button` → `icon-button.md`, `Table / TD Text` → `table/td-text.md`, directly parallel to `registry/table/td-text.yaml`.

Every component document must follow the standard in [`STANDARD.md`](STANDARD.md): name/summary, purpose, use-when/do-not-use-when, architectural level, anatomy, public API in canonical order, property definitions, controlled groups, states, sizing, typography roles, token usage, composition, content guidance, accessibility, responsive behavior, examples, anti-examples, known limitations, and lifecycle status.

No prose component documents yet — but a component inventory now exists: [`registry/`](registry/README.md) holds structured level/role/composition data for 96 components, imported from the project owner's Airtable registry on 2026-08-20. The *inventory* exists; the per-component documentation this directory is for is [`PLAN.md`](../../PLAN.md) Stage 4 work. Start each document from its `registry/` entry rather than from scratch — level, role and composition are already filled in.

`npm run registry:view` renders the whole inventory as one readable file, which is the fastest way to see what is documented and what is not: a component counts as documented when its Markdown file exists at the mirrored path, and nothing has to be marked by hand for that to show up.

## The contract and its implementations

**A component's contract is authored here. Figma and the future Svelte package are implementations of it.**

This is not a preference about where files live. A contract that two things must satisfy cannot be held by either of them: if Figma held it, a Figma limitation would become a rule of the system. The concrete case — Figma cannot give a frame both `hug` width and text truncation, while CSS can. Read from Figma, that component's contract would say it does not truncate, which is false about the system and merely true about the tool.

So the contract states **intent**: what the component is, what properties it exposes, what values they take, what it does. Each implementation then satisfies it as far as it can.

### Exceptions are declared, not permitted

Where an implementation genuinely cannot comply, the divergence is **recorded in the contract**, naming the implementation and the reason. An undeclared divergence is a defect.

The distinction matters. "Exceptions are allowed" means every difference is acceptable, the report fills with noise, and the report stops being read. "Exceptions are declared" means a difference is either written down with a justification or it is a fault — the same mechanism as `mode_dependent` in the token pipeline, where an undeclared divergence fails the build and so does a declaration that is no longer true.

### Figma comes first in time, not in authority

In practice a component is tried in Figma before it is written down: that is where it is designed. The contract is then written **from** it, after review — and the review is the step where mistakes and accumulated dirt are filtered out rather than transcribed. From that point Figma follows the contract, and is checked against it.

The repository still never writes to Figma ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §1). Checking is not editing.

### Where a thing is written down

Figma stays the place for StateDiagrams, PropTables, anatomy diagrams and variant matrices — spatial documentation that text reproduces badly. That is a question of medium, not of authority: the contract those diagrams illustrate is still authored here. Don't duplicate a PropTable that already renders correctly in Figma — link to it.

Which of `STANDARD.md`'s twenty points are authoritative in which medium is still open ([`PLAN.md`](../../PLAN.md) Stage 4).
