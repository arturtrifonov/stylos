# Sizing

Status: Confirmed
Scope: How a component's dimensions are arrived at on each axis and what the size levels mean; the space between components is [spacing.md](spacing.md).

## What an axis can do

### FND-SIZING-01 — Every axis is one of four kinds

**MUST.** Each axis of each component is `hug`, `fixed`, `fill` or `absolute`, and the contract records which in `sizing_model.horizontal` and `sizing_model.vertical`.

Why: the word says **how the dimension is arrived at** — not who decides it, and not whether it ever changes. Without it recorded, every consumer has to discover the answer by resizing the instance and watching.

| Value | The dimension is |
| --- | --- |
| `hug` | whatever the contents need |
| `fixed` | a definite number |
| `fill` | whatever the container has left |
| `absolute` | set by position rather than by layout — the node is out of the flow |

Checked by: `npm run validate:registry` — the axis must be one of the four.

### FND-SIZING-02 — `fixed` and adjustable are orthogonal

**MUST.** The axis records how the dimension is arrived at; `sizing_model.adjustable` records who names it. Neither implies the other.

Why: this is the one that gets confused. **`fixed` means the component always has a definite dimension rather than a rubber one**; **adjustable means that number is the consumer's to name.** A component can be both at once: it ships a sensible value, and a layout that needs a different one sets it outright. Setting a fixed dimension to another fixed dimension does not make the axis `fill`.

`fill` is a different claim. It says the dimension is surrendered to the container and has no value of its own until the container is measured — "take what is left", not "take this number".

The test: **if the number can be written down without knowing what the component is inside, the axis is `fixed`.** If it cannot, it is `fill` or `hug`.

## Per-axis decision order

### FND-SIZING-03 — A dimension is decided per axis, in order

**MUST.** Dimensions are evaluated one axis at a time, in this order:

1. If a `size`-type component property controls the dimension, change only that property.
2. If the dimension is variable-bound, preserve the binding or switch to another supported variable.
3. If a fixed, unbound dimension is genuinely external layout capacity, it may be adjusted.
4. Otherwise, preserve the component's intrinsic dimension and resizing behaviour.

Why: the order is what stops the cheapest edit from being the first one reached for — resizing the frame — when a published property or a variable would have carried the same change for everyone.

Usually adjustable: text-field, search-field, panel and card width; dialog width where the pattern allows. Usually intrinsic: control height, icon-button dimensions, icon size, checkbox and radio indicators, internal actions, internal padding, internal gaps.

### FND-SIZING-04 — An instance keeps the resizing behaviour it was drawn with

**MUST.** Preserve `Hug contents` unless a documented pattern supports `Fill container`; use `Fill container` only on an axis meant to respond to its parent; preserve min/max constraints and required aspect ratios.

Why: resize behaviour is part of what the component is, and an instance that hugs where the component fills reports its own dimensions rather than the layout's — the divergence shows up as one screen that cannot be reflowed.

Serves: PRN-06.

### FND-SIZING-05 — An instance is never scaled to hit a reference measurement

**MUST.** An instance is not scaled to match a measurement taken from a reference.

Why: it is the single most common way a reconstruction ends up with a component that looks right and behaves like nothing else in the library — the geometry matches and every token binding beneath it is now a lie.

Serves: PRN-04.

## The scale, and what the level mapping means

### FND-SIZING-06 — The scale is pixels on a base of 8, and rem is not part of it

**MUST.** Dimensions come from the pixel scale — finely subdivided at the small end, coarser as values grow — and never from a rem-based one.

Why: a rem-based scale makes sense when a component's dimensions derive from its font size. Stylos does not work that way — sizes are set directly — so a relative unit adds a second base to reason about and nothing else.

Values live in [`tokens/`](../../tokens/README.md) under `dimension-scale` and are aliased by the `size` role in `dimension`; `npm run tokens:report dimension-scale dimension` prints them.

The collection is called `dimension` because it holds both — a control's height and the gap beside it are both lengths in the layout plane. It is not called `space`: a control's height is not spacing.

### FND-SIZING-07 — The level mapping is a recommendation

**MAY.** A component may take any value on the scale; the runs below say what a component of that level and size usually is, and that is the whole of their authority.

| Level | XS | S | M | L | XL |
| --- | --- | --- | --- | --- | --- |
| Primitive | `s-1_500` | `s-1_750` | `s-2_000` | `s-2_250` | `s-2_500` |
| Element | `s-2_000` | `s-2_500` | `s-3_000` | `s-3_500` | `s-4_000` |
| Object | `s-3_000` | `s-4_000` | `s-5_000` | `s-6_000` | `s-7_000` |

Why: the recommendation exists to make matching easy, not to make deviation wrong. It says what a component of that level and size usually is — a medium Object is normally 40px tall — so a new component built to it lines up with most of what already exists; a status indicator showing "online" is 8px, well below the smallest recommended Primitive, because at 12 it would read as enormous — and nothing flags that.

The runs overlap deliberately, two steps at each seam: `s-2_000` and `s-2_500` serve both a large Primitive and a small Element, and `s-3_000` and `s-4_000` both a large Element and a small Object. Deviate when the component's visual weight, borders, or treatment call for it.

### FND-SIZING-08 — Only Element and Object have a mechanically applied grid

**MUST.** A skill applies the size grid at Element and Object level only; every other level's sizing is documented per component.

Why: permanent rather than unfinished. A shared grid can only exist where components at that level have comparable structure, and beyond Object they do not — Modal, Alert, Breadcrumbs and Header are too heterogeneous for a shared rule to mean anything. Primitive has the recommendation above but no skill-enforced grid.

The same boundary governs typography (FND-TYPOGRAPHY-09).

## Exemptions

### FND-SIZING-09 — A fixed dimension above the top of the scale is a legitimate raw value

**MAY.** A fixed `width` or `height` larger than the largest value `dimension` defines is a raw value by design, not an unbound one.

Why: the scale stops where components stop. It carries the heights, widths and gaps a control can plausibly take, and nothing above that, because a layout dimension is not the kind of thing this system sets out to constrain: a frame 200 wide is 200 because a screen put it there, and there is no design decision hidden in the number. There is no token to bind it to, and adding one would be inventing a rule about layout the system does not want to make.

The exemption is narrow, on purpose:

- **Only `width` and `height`, and only where they are fixed.** Padding, gap, corner radius and stroke weight above the top of the scale are suspicious rather than exempt — those are treatments, and a treatment that large is usually a mistake.
- **Only above the top.** A fixed dimension inside the scale's range that matches no step is an off-scale value and stays a finding: there the token exists and was not used.

Anything that applies this exemption states the top of the scale it read, so the basis is visible rather than assumed.

Serves: PRN-01.

### FND-SIZING-10 — A `SCALE` constraint may carry an unbound number

**MAY.** A layer outside auto layout whose constraint on an axis is `SCALE` may hold an unbound number on that axis.

Why: a layer that has to grow with its parent does it through constraints, not through auto layout — the parent is a plain frame, the child's constraint on that axis is `SCALE`, and Figma multiplies the child's dimension as the frame is resized. A dimension bound to a variable does not participate in that: the variable pins the value and the scaling has nothing to move. The two mechanisms are alternatives, and choosing one means giving up the other.

This is what `adjustable: true` in a contract's `sizing_model` costs. A component that a consumer resizes by setting one number — Button Inner, Loader, Indicator — needs its interior to follow that number, and inside Figma that means scale constraints and raw values beneath them.

The exemption is per axis and no wider. A layer scaling horizontally has no claim on its height, and the parent being a plain frame does not exempt anything by itself — the constraint has to be `SCALE`. Padding, radius, stroke weight and type are unaffected: nothing about scaling requires them to be raw.

**This one is worth seeing.** Unlike a dimension above the scale, a scale-constrained value is a real design decision with a cost — it will not follow a token when the scale moves — so it is reported as information rather than passed over in silence.

### FND-SIZING-11 — A layer's sizing is judged where it is visible

**MUST.** A hidden layer's dimensions are not judged; where the same layer is visible in another variant, that occurrence carries the finding, and where it is hidden in every variant its sizing cannot be established at all — which is what gets said, once, rather than a warning per variant.

Why: Figma does not preserve fill sizing on a hidden layer. Taken out of the auto-layout flow it reports `layoutSizingHorizontal: FIXED` and keeps whatever width it last had, and a hidden text layer reports `textAutoResize: NONE` the same way. None of that is what the layer will do once it is visible.

This is about sizing only. A hidden layer's colours, radii, stroke weights and type are as real as any other layer's — they are not distorted by being hidden, and they become visible with it.
