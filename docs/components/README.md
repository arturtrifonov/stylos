# docs/components/

**A component is described by exactly one file: its registry entry.** [`registry/<path>.yaml`](registry/README.md), at the path its `id` implies — `Icon Button` → `registry/icon-button.yaml`, `Table / TD Text` → `registry/table/td-text.yaml`. There is no companion Markdown document and no template for one; that model was withdrawn on 2026-08-26, and [`STANDARD.md`](STANDARD.md) says what replaced it and why.

Two files here, then, and both are normative:

- [`STANDARD.md`](STANDARD.md) — what a contract must contain, and when a component is ready to publish.
- [`registry/README.md`](registry/README.md) — the schema, field by field.

96 entries exist, imported from the project owner's Airtable registry on 2026-08-20; three of them carry a full contract. Writing the rest is [`PLAN.md`](../../PLAN.md) Stage 4 work, and each starts from its existing entry rather than from scratch — level, role and composition are already filled in.

**The readable page is generated, not written.**

```bash
npm run components:view    # build/components/ — one page per component, plus an index
npm run registry:view      # build/registry.html — the filterable index over all 96
```

Both are derived, gitignored and opened from disk; neither reaches the network. `documented` in the index is derived too — an entry counts as documented when it carries a `summary`, a `purpose`, at least one `use_when` and a `description` on every property, so nothing has to be ticked by hand for it to become true.

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

### One component or a variant

A visual treatment that shares anatomy and API with another is a `style` value, not a separate component — that is what the property is for.

**Except where the variant matrix would make the set too large.** Button's treatments — base, hollow, ghost — are conceptually `style` values, and they are separate components because adding a third dimension to `tone` × `size` × `state` multiplies the set threefold, and Figma's performance suffers on sets that size. Decomposition is preferred over a set that is slow to open.

This is a declared exception in the sense §"Exceptions are declared, not permitted" means: the contract records that these are separate components, and records that the reason is a Figma limit rather than a difference in the components themselves. A Svelte implementation has no such limit and may expose them as one component with a `style` prop — which is exactly the kind of divergence the contract exists to carry.

Related-but-separate components share a name prefix — `Button Base`, `Button Hollow`. That prefix is how Figma itself decides components are related, and it survives into instance names, which a slash path does not ([`naming.md`](../foundations/naming.md) §2).

### Where a thing is written down

Figma stays the place for StateDiagrams, PropTables, anatomy diagrams and variant matrices — spatial documentation that text reproduces badly. That is a question of medium, not of authority: the contract those diagrams illustrate is still authored here. Don't duplicate a PropTable that already renders correctly in Figma — link to it.

Which medium is authoritative for what is settled: the contract is the registry entry, Figma holds the values and the spatial documentation, and the generated page is a rendering of the first ([`STANDARD.md`](STANDARD.md)).
