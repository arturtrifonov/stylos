# docs/foundations/

One document per foundation: the confirmed rules, the naming patterns, the constraints — detailed enough that neither a designer nor a Figma Agent skill has to reverse-engineer intent from the Figma file.

| Foundation | State |
| --- | --- |
| [color.md](color.md) | structure confirmed; the dark transform rule and the theme contract are open |
| [typography.md](typography.md) | confirmed |
| [spacing.md](spacing.md) | scale and naming model confirmed; which steps stay is open |
| [sizing.md](sizing.md) | rules confirmed; the Element/Object scale is open |
| [naming.md](naming.md) | confirmed — the naming contract for components, layers and properties |
| [icons.md](icons.md) | usage rules confirmed; the icon source is interim |
| [effects.md](effects.md) | structure confirmed; the shadow scale is open |

## What belongs here

Rules, and the reasoning behind them. **Not values** — those live in [`tokens/`](../../tokens/README.md) and are rendered with `npm run tokens:report`.

Do not invent a value to fill a gap. If something is not settled, the document says so and points at the stage in [`PLAN.md`](../../PLAN.md) that settles it.
