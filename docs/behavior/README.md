# docs/behavior/

**The laws components inherit** — how anything in the system responds to a person: what a state means, where focus goes, what a key does, what happens while data is loading and what is shown when there is none.

A behaviour is written once, and every component in that situation inherits it. A component contract may say which of a behaviour's options it takes. It may not decide the same question differently ([RULES.md](../RULES.md) RUL-12). What a surface is *made of* belongs in [`foundations/`](../foundations/README.md). How a whole recurring screen is assembled from these behaviours belongs in [`patterns/`](../patterns/README.md).

Written to the grammar in [`docs/RULES.md`](../RULES.md); rules here carry `BEH-` IDs. `npm run validate:rules` checks that this table and the files agree.

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

**Every file is a scope line and nothing else**, and says so in its status. SPEC 0013 created the complete set, with every file empty. The place for a rule has to exist before the rule is decided; otherwise the rule is written in whatever document its author happens to have open. Nothing here is settled yet, and no file should be read as if it were.
