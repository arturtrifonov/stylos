# docs/foundations/

**The visual language** — what the system's surfaces are made of: colour, type, measure, weight, movement. One document per foundation, written to the grammar in [`docs/RULES.md`](../RULES.md), detailed enough that neither a designer nor a Figma Agent skill has to reverse-engineer intent from the Figma file.

A foundation says what a thing is made of. What a component *does* with it is [`behavior/`](../behavior/README.md); how a recurring screen is assembled is [`patterns/`](../patterns/README.md); what it says in words is [`content/`](../content/README.md).

This table is an index over the files, not a second opinion: where the two disagree the file wins, because the file is what gets read. `npm run validate:rules` holds them in agreement.

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

**Confirmed means the structure and the rules are settled, not that nothing is left.** `color.md` and `effects.md` each keep an `## Open` section naming the gaps that remain — a sixth status colour, two unrelated meanings of `base`, what an elevation level means for a given surface. Those are questions inside a settled model, and they are listed where they belong rather than held against the whole document.

**Yet to fill means the file is a scope line and nothing else.** It is a place, so that the rule which belongs there is not written in a contract's `notes` or in a spec instead ([SPEC 0013](../specs/0013-guideline-structure.md)). What each of them will say is not decided here.

The eight *Confirmed* files are written in the rule grammar: every normative statement in them is a rule block with an `FND-` ID, a level and a `Why:` ([`docs/RULES.md`](../RULES.md)). Cite one by ID — `FND-COLOR-02`, `FND-NAMING-17` — and `npm run validate:rules` will fail the citation if the rule is ever deleted.

## What belongs here

Rules, and the reasoning behind them. **Not values** — those live in [`tokens/`](../../tokens/README.md) and are rendered with `npm run tokens:report` (RUL-09).

Do not invent a value to fill a gap. If something is not settled, the document says so under `## Open` and points at the stage in [`PLAN.md`](../../PLAN.md) that settles it.
