# Component standard

**Normative.** What a component's contract must contain, and when the component is ready to publish.

## There is one document, and it is the registry entry

Every component is described by exactly one file: `registry/<path>.yaml`, at the path its `id` implies. There is no companion Markdown document, and no template for one.

This replaces the earlier model — a twenty-point Markdown document per component, with a `_template.md` to keep them uniform. That model was withdrawn on 2026-08-26 because a template is an attempt to formalise prose, and prose only ever looks uniform. Nothing checked that a section was present, that a value existed, that a named alternative still existed, or that a property list matched Figma. Every one of those is checkable once the contract is data.

The readable page a designer or an agent opens is **generated** from the entry. It is not authored, not committed, and never edited by hand. The schema, field by field, is in [`registry/README.md`](registry/README.md).

**Prose did not disappear — it moved into fields.** `purpose`, `use_when`, `do_not_use_when`, the `description` on every property, `rationale` on a value, `sizing_model.intent`, `limitations`. What disappeared is prose with nowhere to belong.

## What the contract is for

Two readers with the same blind spot. A designer can see a component's appearance in Figma but not its intended role, its boundaries, its supported composition, its resizable axes, or why a size that fails an accessibility criterion is shipped anyway. An agent has exactly the same gap and will confidently configure the component wrongly when those are unrecorded.

A contract that describes only appearance has not met this standard. Appearance is in Figma, and it is better there.

## Complete enough to publish

A contract is complete when:

- `summary`, `purpose`, at least one `use_when` and at least one `do_not_use_when` are present;
- every `do_not_use_when` that names an alternative resolves to a component that exists in the registry;
- every property in Figma appears in `api`, with the same name, the same values, in the same order;
- every property has a `description`, and every default is one of that property's values;
- any property combination that does not exist is stated as a rule, in `limitations` or on the value it constrains;
- `sizing_model` has a row per size value and an `intent`, and every dimension and type measure in it is a token name that resolves against `tokens/`, never a number;
- every value carrying an `a11y` finding also carries a `rationale` saying why it is shipped;
- `figma.node_id` is present and `last_verified` is not older than the component's last change.

## Ready to publish

The rule above says when the *contract* is complete. This says when the *component* is ready for the library. Both have to hold.

A component is ready when:

- its name, layers, properties and values follow [naming.md](../foundations/naming.md);
- no default or meaningless layer names remain;
- its public properties are in the canonical order, and controlled groups are adjacent;
- the supported states and combinations are valid;
- token-relevant values are variable- or style-backed, unless a documented exception applies;
- every variable, style and component reference resolves;
- aliases and modes resolve in every supported theme;
- the primary text role and any component-specific size mapping are recorded in `sizing_model`;
- intrinsic and adjustable axes are recorded;
- accessibility findings are recorded as findings, with a `rationale` where the component ships anyway;
- existing instances have an understood migration path for any breaking change.

Most of these are what `stylos-component-integrity-check` and `stylos-naming-cleanup` check for. Run them; do not re-check by eye what a skill checks reliably.

## Working rules

- **Start from what is already in the entry.** Level, role and relations are recorded for all 96 components. Transcribing them again is how they drift.
- **Measurements are read from Figma, reasons are authored.** A number nobody measured is a guess with a decimal point. A reason nobody stated is an invention.
- **Do not record what Figma answers on demand.** Token bindings, layer names, auto-layout settings and stroke positions belong to the implementation of the design library and are read from it when needed. The contract records decisions, not the state of a file.
- **A missing section is stated, not omitted.** `"None — fixed on both axes"` is documentation. Silence is not. Where the schema has no field for an absence, `notes` does.

## Status

Three contracts exist — the Checkbox family. The inventory exists: 96 entries under [`registry/`](registry/README.md). The v0.1 core set of 23 components is scheduled in [`PLAN.md`](../../PLAN.md) Stage 4.
