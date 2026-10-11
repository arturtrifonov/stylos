# Motion

Status: Confirmed
Scope: Duration, easing, visual delay and motion profiles; behavioural waits belong in [Timing](../behavior/timing.md), and focus, modality and dismissal belong in their behaviour documents.

## Character

### FND-MOTION-01 — Motion explains a change or an ongoing condition

**SHOULD.** Use motion to explain a state change, a spatial relationship or an ongoing condition.

Why: movement attracts attention, so it earns that attention by conveying information.

Serves: PRN-03, PRN-07.

### FND-MOTION-02 — Ordinary motion settles without overshoot

**SHOULD.** Use motion without bounce or overshoot as the default.

Why: restrained movement preserves the system's precise character.

## Parameters

### FND-MOTION-03 — Parameters belong to the system

**MUST.** Select duration, easing and visual delay from the system's shared motion parameters.

Why: common parameters keep components and implementations consistent.

Values and curve definitions are maintained and tuned in the token record (RUL-09); roles and selection rules belong here.

Shared spatial profiles belong here; FND-MOTION-19 defines surface entry. Other travel distances and scale amounts remain component decisions.

### FND-MOTION-04 — Duration follows the kind and extent of the change

**MUST.** Choose duration by the kind and extent of the change using the roles below.

Why: local changes need a direct response; larger movements need time to remain clear.

| Role | Use |
| --- | --- |
| `micro` | Fixed duration for small linear changes, independent of enter/exit |
| `short/enter`, `short/exit` | Small elements appearing or disappearing |
| `medium/enter`, `medium/exit` | Compact surfaces and moderate changes |
| `long/enter`, `long/exit` | Large surface movements and structural changes |
| `cycle` | The period of a repeated animation, separate from the transition scale |

The surface groups progress from `short` to `medium` to `long`; each has an enter/exit pair. Travel distance, affected area and purpose guide the choice, not `size` alone. Immediate changes have no animated interval.

### FND-MOTION-05 — Easing follows the type of movement

**SHOULD.** Select easing by how the change starts, travels and settles.

Why: the distribution of speed gives movement its character.

| Role | Character |
| --- | --- |
| `enter` | Prompt start, deceleration into place |
| `exit` | Acceleration away from rest |
| `linear` | Constant progress through the animated value |

## Recommended profiles

### FND-MOTION-06 — Start from the profile for the kind of change

**SHOULD.** Start from the recommended profile for the kind of change below.

Why: profiles provide consistent defaults while leaving the component responsible for its choice.

| Change | Examples | Duration | Easing |
| --- | --- | --- | --- |
| Local state | Hover, press, selection treatment | `micro` | `linear` |
| Small element entering | A small mark appearing | `short/enter` | `enter` |
| Small element leaving | The same mark disappearing | `short/exit` | `exit` |
| Compact surface entering | Tooltip, dropdown, popover | `medium/enter` | `enter` |
| Compact surface leaving | The same surface closing | `medium/exit` | `exit` |
| Detached surface entering | Modal | `medium/enter` | `enter` |
| Detached surface leaving | Modal closing | `medium/exit` | `exit` |
| Large panel entering | Drawer, edge-attached panel | `long/enter` | `enter` |
| Large panel leaving | The same panel closing | `long/exit` | `exit` |
| Region expanding | Expanding region, panel width | `medium/enter` or `long/enter` | `enter` |
| Region collapsing | The same region contracting | `medium/exit` or `long/exit` | `exit` |
| Constant-speed rotation | Rotating loading mark | `cycle` | `linear` |

FND-MOTION-04 guides choices within a row. Control-attached and free surfaces follow FND-MOTION-19; window-edge panels follow FND-MOTION-18. Departures follow FND-MOTION-15.

### FND-MOTION-07 — Each exit duration is shorter than its paired entry

**MUST.** Use a shorter duration for an animated exit than for its paired entry.

Why: entry establishes a surface; exit follows a decision already made.

## Direction and origin

### FND-MOTION-08 — Direction follows the spatial relationship

**SHOULD.** Choose a surface's movement direction and origin from its relationship to its anchor or layout edge.

Why: the movement explains where the surface belongs.

### FND-MOTION-09 — Opacity, translation and scale can be combined

**MAY.** Combine opacity, translation and scale within one transition.

Why: complementary changes can explain a surface's arrival or departure together.

Whole-surface scaling also affects its contents. The component records the combination under FND-MOTION-15 and coordinates it under FND-MOTION-11.

### FND-MOTION-16 — Surfaces before Drawer share one entry profile

**RETIRED** 2026-10-11. Tooltip, Dropdown, Popover and Modal previously shared the same spatial entry values.

Why: FND-MOTION-19 selects intensity by Layers level, and FND-MOTION-18 separates edge attachment from depth.

### FND-MOTION-17 — Spatial entry intensity follows the Layers level

**RETIRED** 2026-10-11. Spatial profiles used arithmetic relative to Dropdown and omitted a general profile for level 5.

Why: FND-MOTION-19 selects existing shift tokens for every level; edge attachment independently selects FND-MOTION-18.

### FND-MOTION-18 — Window-edge panels move from their attached edge

**MUST.** Give window-edge panels a translation from their attached edge without scaling their contents.

Why: an edge panel extends the window; shrinking it would break that connection.

Entry uses `long/enter` with `enter`; exit uses `long/exit` with `exit`. Translation follows the attachment side and the panel's own extent. Reduced motion makes the change immediate (FND-MOTION-13). The level does not exclude free surfaces above the panel from FND-MOTION-19.

### FND-MOTION-19 — Surface entry selects a fixed profile by level

**MUST.** Use the level's shared spatial entry profile for control-attached and free surfaces at levels 2 through 6 under FND-LAYERS-01 and FND-LAYERS-02.

Why: surfaces closer to the person have a stronger arrival while retaining one motion character.

Each level has a fixed profile. Its shift references an existing semantic gap token; its scale is recorded explicitly. Profiles are selected by level, without arithmetic based on that level. Level 5 has a general profile like the other elevated levels. Window-edge attachment selects FND-MOTION-18 independently of depth.

| Level | Shift token | Scale parameter |
| --- | --- | --- |
| 0 | `dimension/gap/g-0_000` | `motion/surface/layer-0/scale` |
| 1 | `dimension/gap/g-0_000` | `motion/surface/layer-1/scale` |
| 2 | `dimension/gap/g-0_625` | `motion/surface/layer-2/scale` |
| 3 | `dimension/gap/g-1_000` | `motion/surface/layer-3/scale` |
| 4 | `dimension/gap/g-1_250` | `motion/surface/layer-4/scale` |
| 5 | `dimension/gap/g-1_750` | `motion/surface/layer-5/scale` |
| 6 | `dimension/gap/g-2_000` | `motion/surface/layer-6/scale` |

Levels 0 and 1 introduce no spatial entry; in-layout controls retain local state transitions under FND-MOTION-06. Current profile values are available through `npm run tokens:report motion` (RUL-09).

Entry combines opacity from zero to one, upward travel to zero and scale to one. All three start together using `medium/enter` and `enter`, without visual delay. Control-attached surfaces scale around their anchor; free surfaces scale around their centre. Floating placement stays independent of the animated transform.

Exit uses opacity only with `medium/exit` and `exit`. An interrupted entry holds its current position and scale during exit; reopening continues from the current presentation (FND-MOTION-10). Reduced motion makes entry and exit immediate (FND-MOTION-13). Behavioural waits, focus and dismissal remain governed by FND-MOTION-11.

Checked by: `npm run tokens:check`, `npm test`.

## Continuity and coordination

### FND-MOTION-10 — Interrupted motion continues from its current presentation

**MUST.** Continue an interrupted transition towards its new target from the currently presented value.

Why: restarting from an old endpoint produces a jump.

Exception: **Immediate transition.** An instant change, including a reduced-motion replacement, moves directly to its target.

### FND-MOTION-11 — Related transitions form one coherent change

**SHOULD.** Coordinate related transitions without visual delay unless their composition needs an intentional sequence.

Why: a surface, its backdrop and its contents are understood together.

Timing defines behavioural waits, such as a tooltip's hover wait or a notification's visible lifetime. Motion defines any additional delay needed to compose the visual transition. The waits are sequential:

```text
animation start = trigger time + behavioural wait + visual delay
animation end   = animation start + duration
```

Focus and modality follow [Focus](../behavior/focus.md) and [Overlays](../behavior/overlays.md); the visual delay does not redefine those behaviours.

## Continuous motion

### FND-MOTION-12 — A loop lasts only while its condition holds

**MUST.** Run a continuous animation only while the condition it represents holds.

Why: movement that no longer reports a process is misleading.

Constant-speed rotation uses `linear`; a pulse may accelerate and decelerate. Repetition alone does not determine easing.

## Reduced motion

### FND-MOTION-13 — Reduced motion has an explicit alternative

**MUST.** Define a reduced-motion alternative that preserves the information and interaction of each motion treatment.

Why: shortening a movement does not necessarily remove it.

| Treatment | Recommended alternative |
| --- | --- |
| Local state transition | Immediate change |
| Entry or exit using translation or scale | Immediate change or restrained opacity transition |
| Animated layout change | Immediate layout change |
| Continuous process indicator | A contract-defined alternative that still indicates the process |

The system policy follows [reduced-motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); FND-ACCESSIBILITY-01 defines the accessibility target.

## Component decisions

### FND-MOTION-14 — The component chooses within the shared language

**MUST.** Choose the component's motion treatment within the system's shared motion language, applying a shared spatial profile where one is defined.

Why: Figma and code implement the same component decision.

### FND-MOTION-15 — The contract records the choice and rationale

**SHOULD.** Record each motion treatment and its rationale in the component contract.

Why: both implementations need to know what the component chose.

The record covers the trigger, animated properties, parameter roles, spatial treatment, any visual sequence and the reduced-motion alternative. It explains departures from recommended profiles. The [registry guide](../components/registry/README.md#motion) defines the record's format.
