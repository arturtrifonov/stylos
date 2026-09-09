# Component standard

**Normative.** What a component's contract must contain, and when the component is ready to publish. Rules here carry `STD-` IDs, in the grammar of [`docs/RULES.md`](../RULES.md).

## There is one document, and it is the registry entry

### STD-01 — A component is described by exactly one file

**MUST.** Every component is described by `registry/<path>.yaml`, at the path its `id` implies. There is no companion Markdown document, and no template for one.

Why: this replaces the earlier model — a twenty-point Markdown document per component, with a `_template.md` to keep them uniform. That model was withdrawn on 2026-08-26 because a template is an attempt to formalise prose, and prose only ever looks uniform. Nothing checked that a section was present, that a value existed, that a named alternative still existed, or that a property list matched Figma. Every one of those is checkable once the contract is data.

**Prose did not disappear — it moved into fields.** `purpose`, `use_when`, `do_not_use_when`, the `description` on every property, `rationale` on a value, `sizing_model.intent`, `limitations`. What disappeared is prose with nowhere to belong.

Checked by: `npm run validate:registry` — an entry's file must sit at the path its `id` implies.

### STD-02 — The readable page is generated, never authored

**MUST.** The page a designer or an agent opens is generated from the entry: not authored, not committed, and never edited by hand.

Why: an authored page is a second copy of the contract, and the copy is what people read — so the moment they diverge, the wrong one is the one in use. The schema, field by field, is in [`registry/README.md`](registry/README.md).

## What the contract is for

### STD-03 — A contract records what Figma cannot show

**MUST.** A contract records the component's role, its boundaries, its supported composition, its resizable axes and the reasons behind them; a contract that describes only appearance has not met this standard.

Why: two readers with the same blind spot. A designer can see a component's appearance in Figma but not its intended role, its boundaries, its supported composition, its resizable axes, or why a size that fails an accessibility criterion is shipped anyway. An agent has exactly the same gap and will confidently configure the component wrongly when those are unrecorded.

Appearance is in Figma, and it is better there.

## The two gates

### STD-04 — A contract is complete when every field it owes is present

**MUST.** A contract is complete when:

- `summary`, `purpose`, at least one `use_when` and at least one `do_not_use_when` are present;
- every `do_not_use_when` that names an alternative resolves to a component that exists in the registry;
- every property in Figma appears in `api`, with the same name, the same values, in the same order — except a property that exists only to draw a state a real component decides for itself, which is recorded in `figma_notes` and named there ([`registry/README.md`](registry/README.md));
- every property has a `description`, and every default is one of that property's values;
- any property combination that does not exist is stated as a rule, in `limitations` or on the value it constrains;
- `sizing_model` has a row per size value and an `intent`, and every dimension and type measure in it is a token name that resolves against `tokens/`, never a number;
- every value carrying an `a11y` finding also carries a `rationale` saying why it is shipped;
- `figma.node_id` is present and `last_verified` is not older than the component's last change.

Why: a contract half-written is worse than an absent one — it reads as the answer, and the fields nobody filled are exactly the ones a consumer would have had to ask about.

Checked by: `npm run validate:registry`, which fails a `status: ready` entry whose contract is not complete.

### STD-05 — A component is ready when the library can carry it

**MUST.** The gate above says when the *contract* is complete; this says when the *component* is ready for the library, and both have to hold. A component is ready when:

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

Why: `status: ready` is a claim consumers build on. Splitting it from STD-04 keeps the two answerable separately — a written-up component nobody has checked in Figma is the ordinary state between a wave closing and the release pass reaching it.

Checked by: `stylos-component-integrity-check` and `stylos-naming-cleanup` cover most of these. Run them; do not re-check by eye what a skill checks reliably.

## Working rules

### STD-06 — Start from what the entry already holds

**MUST.** Level, role and relations are read from the entry rather than restated beside it.

Why: they are recorded for every component, and transcribing them again is how they drift (RUL-11).

### STD-07 — Measurements are read from Figma; reasons are authored

**MUST.** A number in a contract comes from a measurement, and a reason comes from a person.

Why: a number nobody measured is a guess with a decimal point. A reason nobody stated is an invention.

Serves: PRN-05.

### STD-08 — What Figma answers on demand is not recorded

**MUST.** Token bindings, layer names, auto-layout settings and stroke positions are read from the file when needed, not copied into the contract.

Why: they belong to the implementation of the design library, and the contract records decisions rather than the state of a file — a copy of that state is stale as soon as anyone opens Figma.

### STD-09 — A missing section is stated, not omitted

**MUST.** An absence is written down: `"None — fixed on both axes"` is documentation, silence is not. Where the schema has no field for the absence, `notes` carries it.

Why: silence cannot be told apart from nobody having looked, and the reader who most needs the answer is the one who cannot tell which it is.

## Status

The inventory exists under [`registry/`](registry/README.md); how many of its entries carry a contract is derived rather than restated here — the registry view counts them, under Contract. The `0.1.0` core set is scheduled in [`PLAN.md`](../../PLAN.md) Stage 4, wave by wave.
