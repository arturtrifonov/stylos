# docs/decisions/

Decision records — kept deliberately few.

## What belongs here

Only a decision that is **expensive to reverse and keeps being re-opened**. A boundary someone will argue with in six months, where the argument is worth having once.

Almost nothing qualifies yet. Stylos is pre-alpha: decisions are cheap, made often, and revised as the system is searched out. In that state a decision record is the wrong instrument — it is a commitment device, and its cost is friction against changing your mind, which is exactly what this stage needs to stay cheap.

Six records lived here and were removed on 2026-08-23. Not because they were wrong, but because their content was better placed:

| What it said | Where it lives now |
| --- | --- |
| Skill version supersession (v0.5 → v0.7) | a note in [`skills/README.md`](../../skills/README.md) |
| Component levels; size grids are Element/Object only | a rule in [`sizing.md`](../foundations/sizing.md) |
| Frontend library foundations (Svelte, Melt UI, plain CSS) | the planned approach in [`PLAN.md`](../../PLAN.md) Stage 5 |
| Proportional logic — the base-8 scale | a rule in [`spacing.md`](../foundations/spacing.md) |
| Token normalization and canonical storage | [SPEC 0001](../specs/0001-token-pipeline.md) and [`tokens/README.md`](../../tokens/README.md) |

Two of those six were already contradicted by the system within a day of being written. That is the argument in miniature: at this stage the durable thing is the **rule**, not the record of deciding it.

## Where things go instead

| Kind | Home |
| --- | --- |
| A rule of the design language | [`docs/foundations/`](../foundations/README.md) — with one sentence of reasoning inline |
| How the system is put together | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) |
| Something to be built | [`docs/specs/`](../specs/README.md) — disposable by design |
| Sequence, gates, estimates | [`PLAN.md`](../../PLAN.md) |
| What changed and when | [`CHANGELOG.md`](../../CHANGELOG.md) |

A rule carries its own justification in a sentence. A rule nobody can justify gets deleted by the next person, and that is the correct outcome.

## Records

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-figma-connection-model.md) | Figma connection model | Accepted |

Numbers are never reused, including by the removed records.
