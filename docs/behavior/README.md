# docs/behavior/

**The laws components inherit** — how anything in the system responds to a person: what a state means, where focus goes, what a key does, what happens while data is loading and what is shown when there is none.

A behaviour is written once and inherited by every component that has the situation. A component contract may say which of a behaviour's options it takes; it may not answer the question differently ([RULES.md](../RULES.md) RUL-12). What a surface is *made of* is [`foundations/`](../foundations/README.md); how a whole recurring screen is assembled from these behaviours is [`patterns/`](../patterns/README.md).

Written to the grammar in [`docs/RULES.md`](../RULES.md); rules here carry `BEH-` IDs. `npm run validate:rules` holds this table and the files in agreement.

| File | Status |
| --- | --- |
| [states.md](states.md) | Yet to fill |
| [focus.md](focus.md) | Yet to fill |
| [keyboard.md](keyboard.md) | Yet to fill |
| [pointer.md](pointer.md) | Yet to fill |
| [selection.md](selection.md) | Yet to fill |
| [overlays.md](overlays.md) | Yet to fill |
| [disabled.md](disabled.md) | Yet to fill |
| [loading.md](loading.md) | Yet to fill |
| [validation.md](validation.md) | Yet to fill |
| [feedback.md](feedback.md) | Yet to fill |
| [destructive.md](destructive.md) | Yet to fill |
| [data-states.md](data-states.md) | Yet to fill |
| [overflow.md](overflow.md) | Yet to fill |
| [scrolling.md](scrolling.md) | Yet to fill |
| [manipulation.md](manipulation.md) | Yet to fill |
| [persistence.md](persistence.md) | Yet to fill |
| [timing.md](timing.md) | Yet to fill |
| [text-input.md](text-input.md) | Yet to fill |

**Every file is a scope line and nothing else**, and says so in its status. The set was created complete and empty by [SPEC 0013](../specs/0013-guideline-structure.md): a rule needs somewhere to be written before it is decided, or it gets written in whichever document its author happened to have open. Nothing here is settled yet, and no file should be read as though it were.
