# docs/specs/

Work orders. Each specifies something to be built, in enough detail that implementation can start without re-deriving decisions.

**Not normative.** A spec says *what to build*; [`docs/decisions/`](../decisions/README.md) says *why*, and [`docs/foundations/`](../foundations/README.md) says what the rules are. On any conflict those win and the spec is corrected. A spec is finished when the thing exists and passes its acceptance criteria; after that it is history, like a closed ticket.

Filename pattern: `NNNN-short-title.md`, numbered sequentially, never renumbered.

## Why these are separate from decision records

A decision record is permanent — it explains a choice long after the choice was made. A spec is disposable — it exists to get something built and stops mattering once it is. Mixing them makes the decision log unreadable, and it makes specs harder to write because they inherit the obligation to justify rather than instruct.

Every spec names the decision record it implements. If a spec finds itself arguing for an approach rather than describing one, that argument belongs in a decision record instead.

## Specs

| # | Title | Implements | Status |
| --- | --- | --- | --- |
| [0001](0001-token-pipeline.md) | Token pipeline | — | Built |
