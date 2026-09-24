# docs/foundations/

**The visual language** — what the system's surfaces are made of: colour, type, measure, weight, movement. There is one document per foundation. Each is written to the grammar in [`docs/RULES.md`](../RULES.md), in enough detail that neither a designer nor a Figma Agent skill has to work out the intent from the Figma file.

A foundation says what a thing is made of. What a component *does* with it belongs in [`behavior/`](../behavior/README.md). How a recurring screen is assembled belongs in [`patterns/`](../patterns/README.md). What it says in words belongs in [`content/`](../content/README.md).

This table is an index of the files and nothing more. Where the table and a file disagree, the file is right, because the file is what gets read. `npm run validate:rules` checks that they agree.

| File | Status |
| --- | --- |
| [color.md](color.md) | Draft |
| [typography.md](typography.md) | Draft |
| [spacing.md](spacing.md) | Draft |
| [sizing.md](sizing.md) | Draft |
| [naming.md](naming.md) | Draft |
| [icons.md](icons.md) | Draft |
| [effects.md](effects.md) | Draft |
| [accessibility.md](accessibility.md) | Draft |
| [tokens.md](tokens.md) | Yet to fill |
| [layout.md](layout.md) | Yet to fill |
| [adaptivity.md](adaptivity.md) | Yet to fill |
| [density.md](density.md) | Yet to fill |
| [elevation.md](elevation.md) | Yet to fill |
| [motion.md](motion.md) | Yet to fill |
| [theming.md](theming.md) | Yet to fill |
| [localization.md](localization.md) | Yet to fill |
| [charts.md](charts.md) | Yet to fill |

**Draft means the rules are written and not yet confirmed**, so any of them can still change. A question a file has not settled is listed under its own `## Open`.

**Yet to fill means the file is a scope line and nothing else.** The file reserves a place, so that the rule which belongs there is not written in a contract's `notes` or in a spec instead (SPEC 0013). This index does not decide what any of these files will say.

The eight *Draft* files are written in the rule grammar: every normative statement in them is a rule block with an `FND-` ID, a level and a `Why:` ([`docs/RULES.md`](../RULES.md)). Cite a rule by its ID, for example `FND-COLOR-02` or `FND-NAMING-19`. If that rule is ever deleted, `npm run validate:rules` fails the citation.

## What belongs here

Rules, and the reasoning behind them. **Not values** — those live in [`tokens/`](../../tokens/README.md) and are rendered with `npm run tokens:report` (RUL-09).

A gap is stated, never filled with an invented value (RUL-18).
