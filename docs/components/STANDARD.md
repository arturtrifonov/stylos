# Component standard

**Normative.** What a component's contract must contain, and when the component is ready to publish. Rules here carry `STD-` IDs, in the grammar of [`docs/RULES.md`](../RULES.md).

## There is one document, and it is the registry entry

### STD-01 — A component is described by exactly one file

**MUST.** Every component is described by `registry/<path>.yaml`, at the path its `id` implies, with no companion Markdown document and no template for one.

Why: this replaces the earlier model — a twenty-point Markdown document per component, with a `_template.md` to keep them uniform. That model was withdrawn on 2026-08-26 because a template is an attempt to formalise prose, and prose can only look uniform. Nothing checked that a section was present, that a value existed, that a named alternative still existed, or that a property list matched the implementation. Every one of those is checkable once the contract is data.

**Prose did not disappear — it moved into fields.** `purpose`, `use_when`, `do_not_use_when`, the `description` on every property, `rationale` on a value, `sizing_model.intent`, `limitations`. What disappeared is prose with nowhere to belong.

Checked by: `npm run validate:registry` — an entry's file must sit at the path its `id` implies.

### STD-02 — The readable page is generated, never authored

**MUST.** The page a designer or an agent opens is generated from the entry: not authored, not committed, and never edited by hand.

Why: an authored page is a second copy of the contract, and people read the copy. As soon as the two differ, the one in use is the wrong one. The schema, field by field, is in [`registry/README.md`](registry/README.md).

## What the contract is for

### STD-03 — A contract records decisions beyond appearance

**MUST.** A contract records the component's role, its boundaries, its supported composition, its resizable axes and the reasons behind them; a contract that describes only appearance has not met this standard.

Why: appearance alone does not explain intended use, composition, adjustable axes or the reasons behind an accessibility finding. A designer, developer or agent needs those decisions recorded to configure the component correctly.

## The two gates

### STD-04 — A contract is complete when every required field is present

**MUST.** A contract is complete when:

- `summary`, `purpose`, at least one `use_when` and at least one `do_not_use_when` are present;
- every `do_not_use_when` that names an alternative resolves to a component that exists in the registry;
- every public property appears in `api`, with its supported values and contract order; implementation names map to it through a documented conversion (FND-NAMING-05). A different Figma representation and controls that only draw states derived by code are recorded in `figma_notes` ([`registry/README.md`](registry/README.md)), and the panel projection is described in [figma/naming.md](../../figma/naming.md);
- every property has a `description`, and every default is one of that property's values;
- any property combination that does not exist is stated as a rule, in `limitations` or on the value it constrains;
- `sizing_model` records both default axes, positioning and per-axis adjustment permissions, has a row per size value and an `intent`, and every dimension and type measure in it is a token name that resolves against `tokens/`, never a number;
- every value carrying an `a11y` finding also carries a `rationale` saying why it is shipped;
- `figma.node_id` identifies an existing Figma representation, and `last_verified` is not older than the component's last change.

A Figma representation is required for readiness. A component implemented only in code cannot be `ready`; the Figma link and verification record are part of the evidence for the gate.

Why: a half-written contract is worse than none. It reads as the answer, and the fields nobody filled in are exactly the ones a consumer would have had to ask about.

Checked by: `npm run validate:registry`, which fails a `status: ready` entry whose contract is not complete.

### STD-05 — A component is ready when it can go into the library

**MUST.** A component is ready for the library when its *contract* is complete (STD-04) and the *component* itself meets every item below:

- its public names and values follow [naming.md](../foundations/naming.md);
- its Figma representation passes the [Figma authoring checks](../../figma/components.md#authoring-checks);
- its public properties are in the canonical order, and controlled groups are adjacent;
- the supported states and combinations are valid;
- every value that a token covers is bound to a variable or a style, unless a documented exception applies;
- every variable, style and component reference resolves;
- aliases and modes resolve in every supported theme;
- the primary text role and any component-specific size mapping are recorded in `sizing_model`;
- intrinsic and adjustable axes are recorded;
- accessibility findings are recorded as findings, with a `rationale` where the component ships anyway;
- existing instances have an understood migration path for any breaking change.

Why: `status: ready` is a claim consumers build on. A documented contract is not proof that the component has been built and checked. The required Figma representation provides that reviewable design; a code implementation alone does not satisfy this gate.

Checked by: `stylos-component-integrity-check` and `stylos-naming-cleanup` cover most of these. Run them; do not re-check by eye what a skill checks reliably.

## Working rules

### STD-06 — Start from what the entry already holds

**MUST.** Level, role and relations are read from the entry rather than restated beside it.

Why: they are recorded for every component, and copying them out again is how they drift (RUL-11).

### STD-07 — Measurements are read; reasons are authored

**MUST.** A number in a contract comes from a measurement, and a reason comes from a person.

Why: a number nobody measured is a guess that looks precise. A reason nobody stated is an invention.

Serves: PRN-05.

### STD-08 — Implementation state is inspected, not copied into the contract

**MUST.** Read implementation details from the implementation when needed rather than copying its current state into the component contract.

Why: the contract records decisions that implementations follow. A copied snapshot can become stale after an implementation changes. Figma-specific inspection details are documented in [figma/components.md](../../figma/components.md#inspection).

### STD-09 — A missing section is stated, not omitted

**MUST.** An absence is written down, in `notes` where the schema has no field for it: `"None — fixed on both axes"` is documentation, and silence is not.

Why: when a section is silent, a reader cannot tell whether there is nothing to record or nobody looked. The reader who most needs the answer is the one who cannot tell which it is.

## Status

The inventory is under [`registry/`](registry/README.md). How many of its entries have a contract is derived, not restated here: the registry view counts them, under Contract. The `0.1.0` core set is scheduled in [`PLAN.md`](../../PLAN.md) Stage 4, wave by wave.
