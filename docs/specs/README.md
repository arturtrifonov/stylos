# docs/specs/

Work orders. Each specifies something to be built, in enough detail that implementation can start without re-deriving decisions.

**Not normative.** A spec says *what to build*; [`docs/decisions/`](../decisions/README.md) says *why*, and [`docs/foundations/`](../foundations/README.md) says what the rules are. On any conflict those win and the spec is corrected. A spec is finished when the thing exists and passes its acceptance criteria; after that it is history, like a closed ticket.

Filename pattern: `NNNN-short-title.md`, numbered sequentially, never renumbered.

## Why these are separate from decision records

A decision record is permanent — it explains a choice long after the choice was made. A spec is disposable — it exists to get something built and stops mattering once it is. Mixing them makes the decision log unreadable, and it makes specs harder to write because they inherit the obligation to justify rather than instruct.

If a spec finds itself arguing for an approach rather than describing one, that argument belongs with the rule it serves — in `docs/foundations/` or `ARCHITECTURE.md` — not in the spec. Decision records are kept for the few boundaries that earn one ([`docs/decisions/README.md`](../decisions/README.md)), so most specs implement a rule rather than a record.

## Specs

| # | Title | Implements | Status |
| --- | --- | --- | --- |
| [0001](0001-token-pipeline.md) | Token pipeline | — | Built |
| [0002](0002-registry-viewer.md) | Registry viewer | `docs/components/README.md` | Built |
| [0003](0003-component-page.md) | Component page | `docs/components/STANDARD.md` | Built |
| [0004](0004-registry-reconciliation.md) | Registry reconciliation | `docs/components/registry/README.md`, `PLAN.md` §4 | Built |
