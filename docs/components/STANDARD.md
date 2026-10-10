# Component standard

Status: Confirmed
Scope: Required component-contract data and readiness for the library; field syntax lives in the registry schema, and implementation checks live with each implementation.

Rules use `STD-` IDs under [Rules of rules](../RULES.md). The [registry schema](registry/README.md) defines the fields they refer to.

## Contract source

### STD-01 — One registry entry holds the contract

**MUST.** Record each component's contract in the registry YAML file at the path its canonical `id` implies.

Why: one source lets readers and tools work from the same decisions.

Checked by: `npm run validate:registry` checks the entry's path.

### STD-02 — Readable contract pages are generated

**MUST.** Generate readable contract pages from the registry entry.

Why: a separately authored page becomes a second contract that can drift.

### STD-03 — The contract describes intended use

**MUST.** Record the component's purpose, boundaries and supported composition beyond its appearance.

Why: consumers need to understand what the component is for and how it fits with others.

## Completeness and readiness

### STD-04 — Complete the required contract data

**MUST.** Complete the required contract data before marking a component ready.

Why: a complete record supplies the decisions a consumer needs, including how public properties and sizing behave.

Required data:

- `level`, `role`, `summary`, `purpose`, at least one `use_when` and at least one `do_not_use_when`.
- Each public property in `api` has a name, kind and description. Variant properties declare their supported values; a variant default belongs to that vocabulary. Boolean defaults are true or false; text and string defaults are strings, and their listed values are examples. Component and slot properties follow their schema.
- `sizing_model` records default sizing and adjustment permission for each axis, plus an `intent`. When the API has a size variant, its rows match that vocabulary in order. Applicable dimensions and text measures refer to tokens; text parts can have different roles and mappings, and components without text need none.
- Unsupported combinations are recorded where they are constrained. Each value carrying an accessibility finding has a `rationale`. Named alternatives and token references resolve.

Public naming and conversion follow FND-NAMING-05; sizing follows FND-SIZING-02 and FND-SIZING-03. Optional fields stay absent when they do not apply. An unresolved decision is stated in `notes` or the relevant finding, rather than filled with a placeholder answer.

Checked by: `npm run validate:registry` rejects missing required data on `ready` entries and checks supported field values and references; contract meaning and coverage are reviewed.

### STD-05 — Readiness includes verification of the implementation

**MUST.** Mark a component ready only after its complete contract and required representations have been verified against each other.

Why: a written contract does not prove that its implementations follow it.

Readiness requires a Figma representation: `figma.file_key` and `figma.node_id` identify a single set, or `figma.sources` maps every visual treatment. Each address records `last_verified` after its latest relevant change. A code-only component cannot be ready. Authoring and publication checks live in [Figma component conventions](../../figma/components.md); frontend checks live in the [package guide](../../packages/ui/README.md#accessibility-implementation-and-verification).

Review covers supported combinations, shared-token use, accessibility conditions and an understood migration path for breaking API changes. Verification of an implementation is separate from contract completeness.

Checked by: `npm run validate:registry` requires a Figma address and a valid verification date for `ready`; live representation, verification freshness and implementation behaviour are reviewed.

## Evidence

### STD-06 — Record the basis for facts and decisions

**MUST.** Base contract facts on an identified source, measurement or calculation, and record reasons as decisions rather than invented explanations.

Why: a precise-looking value can still be a guess, while a proposed reason is not evidence that a decision was made.

Serves: PRN-05.

### STD-07 — Inspect implementation details at their source

**MUST.** Inspect current implementation details where they live instead of copying them into the contract as system requirements.

Why: implementation state can change without changing the component's intended behaviour.
