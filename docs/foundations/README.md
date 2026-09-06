# docs/foundations/

One document per foundation: the confirmed rules, the naming patterns, the constraints — detailed enough that neither a designer nor a Figma Agent skill has to reverse-engineer intent from the Figma file.

Each row states what its file states. This table is an index over them, not a second opinion: where the two disagree the file wins, because the file is what gets read.

| Foundation | State |
| --- | --- |
| [color.md](color.md) | confirmed |
| [typography.md](typography.md) | confirmed |
| [spacing.md](spacing.md) | confirmed |
| [sizing.md](sizing.md) | confirmed |
| [naming.md](naming.md) | confirmed — the naming contract for components, layers and properties |
| [icons.md](icons.md) | usage rules confirmed; the icon source is interim |
| [effects.md](effects.md) | confirmed |
| [accessibility.md](accessibility.md) | confirmed — the conformance target and the browser floor |

**Confirmed means the structure and the rules are settled, not that nothing is left.** `color.md` and `effects.md` each keep an *Open* section naming the gaps that remain — a sixth status colour, two unrelated meanings of `base`, what an elevation level means for a given surface. Those are questions inside a settled model, and they are listed where they belong rather than held against the whole document.

## What belongs here

Rules, and the reasoning behind them. **Not values** — those live in [`tokens/`](../../tokens/README.md) and are rendered with `npm run tokens:report`.

Do not invent a value to fill a gap. If something is not settled, the document says so and points at the stage in [`PLAN.md`](../../PLAN.md) that settles it.
