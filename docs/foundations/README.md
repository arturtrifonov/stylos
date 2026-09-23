# docs/foundations/

**The visual language** — what the system's surfaces are made of: colour, type, measure, weight, movement. There is one document per foundation. Each is written to the grammar in [`docs/RULES.md`](../RULES.md), in enough detail that neither a designer nor a Figma Agent skill has to work out the intent from the Figma file.

A foundation says what a thing is made of. What a component *does* with it belongs in [`behavior/`](../behavior/README.md). How a recurring screen is assembled belongs in [`patterns/`](../patterns/README.md). What it says in words belongs in [`content/`](../content/README.md).

This table is an index of the files and nothing more. Where the table and a file disagree, the file is right, because the file is what gets read. `npm run validate:rules` checks that they agree.

| File | Status |
| --- | --- |
| [color.md](color.md) | Confirmed |
| [typography.md](typography.md) | Confirmed |
| [spacing.md](spacing.md) | Confirmed |
| [sizing.md](sizing.md) | Confirmed |
| [naming.md](naming.md) | Confirmed |
| [icons.md](icons.md) | Confirmed |
| [effects.md](effects.md) | Confirmed |
| [accessibility.md](accessibility.md) | Confirmed |
| [tokens.md](tokens.md) | Yet to fill |
| [layout.md](layout.md) | Yet to fill |
| [adaptivity.md](adaptivity.md) | Yet to fill |
| [density.md](density.md) | Yet to fill |
| [elevation.md](elevation.md) | Yet to fill |
| [motion.md](motion.md) | Yet to fill |
| [theming.md](theming.md) | Yet to fill |
| [localization.md](localization.md) | Yet to fill |
| [charts.md](charts.md) | Yet to fill |

**Confirmed means the structure and the rules are settled, not that nothing is left to decide.** `color.md` and `effects.md` each keep an `## Open` section that names the gaps that remain: a sixth status colour, two unrelated meanings of `base`, and what an elevation level means for a given surface. These are questions inside a settled model. They are listed in the file they belong to, and they do not stop that file from being *Confirmed*.

**Yet to fill means the file is a scope line and nothing else.** The file reserves a place, so that the rule which belongs there is not written in a contract's `notes` or in a spec instead (SPEC 0013). This index does not decide what any of these files will say.

The eight *Confirmed* files are written in the rule grammar: every normative statement in them is a rule block with an `FND-` ID, a level and a `Why:` ([`docs/RULES.md`](../RULES.md)). Cite a rule by its ID, for example `FND-COLOR-02` or `FND-NAMING-17`. If that rule is ever deleted, `npm run validate:rules` fails the citation.

## What belongs here

Rules, and the reasoning behind them. **Not values** — those live in [`tokens/`](../../tokens/README.md) and are rendered with `npm run tokens:report` (RUL-09).

Do not invent a value to fill a gap. If something is not settled, the document says so under `## Open` and points at the stage in [`PLAN.md`](../../PLAN.md) that settles it.
