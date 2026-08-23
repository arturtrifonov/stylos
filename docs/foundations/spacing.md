# Spacing

Status: **Confirmed.**

## Confirmed

- The scale is **base-8, named as a ratio to that base** — `s-1_000` is 8, `s-1_500` is 12.
- Spacing is drawn from the scale. A value that is not on the scale is not a spacing value, and adding one is a system decision, not a local exception.
- Two layers: primitives in the scale collection, semantic roles beside them. Semantic roles carry a role prefix — `s-` for size, `g-` for gap — and reuse the same ratio suffix as the primitive they correspond to.

**Ratio names are the point, not a convenience.** `s-1_500` says "one and a half bases", not "12 pixels", and that is deliberate: the scale exists so that decisions are made in relations rather than in measurements. Absolute names (`s-12`), ordinals (`s-3`) and T-shirt names all lose that — the first invites reasoning in pixels, the other two hide the ratio entirely. The cost is one multiplication when a pixel value is genuinely needed, which is rare.

## Values

**Not transcribed here.** Run `npm run tokens:report` — it renders the current scale from `tokens/`. See [color.md](color.md) for why.

Sizes and gaps share the collection `dimension` — both are lengths in the layout plane. Spacing is the `g-` half of it; control dimensions are the `s-` half, and those are [sizing.md](sizing.md)'s subject.
