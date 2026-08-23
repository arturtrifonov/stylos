# Spacing

Status: **Structure and naming model confirmed, values not ratified.**

## Confirmed

- The scale is **base-8, named as a ratio to that base** — `s-1_000` is 8, `s-1_500` is 12.
- Spacing is drawn from the scale. A value that is not on the scale is not a spacing value, and adding one is a system decision, not a local exception.
- Two layers: primitives in `space.scale`, semantic roles in `space`. Semantic roles carry a role prefix — `s-` for size, `g-` for gap — and reuse the same ratio suffix as the primitive they correspond to.
- The naming-model comparison, when it runs, must stay specific to spacing and compare at minimum: absolute value names, scale-position names, ordinal numeric names, T-shirt names, relational semantic names, property/context-based names, and hybrid models. It must document trade-offs, contexts, exceptions, and implications for both Figma and code. Generic token-taxonomy arguments count only if they produce a concrete spacing decision.

## Values

**Not transcribed here.** Run `npm run report:tokens` — it renders the current scale from the newest snapshot. See [effects.md](effects.md) for why.

## Open

- Ratification of the scale: which steps earn their place, and whether the semantic `space` collection should mirror the primitive scale as closely as it does. [`PLAN.md`](../../PLAN.md) Stage 1.
- Ratification of the naming model. Ratio-to-base is implemented and in use, so the research reviews a live model rather than choosing among seven candidates — but "already built" is not "right". [`PLAN.md`](../../PLAN.md) Stage 1.
- Whether `size` belongs in the spacing collection at all, or in [sizing](sizing.md). It is currently a spacing role, which is arguable: a control's height is not spacing.

## TODO

- [ ] Run the naming-model comparison; write it up in `docs/research/` before it becomes a decision record.
- [ ] Ratify the scale, removing steps that exist only because a component once needed them.
- [ ] Decide where `size` belongs.
