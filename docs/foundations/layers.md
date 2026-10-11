# Layers

Status: Confirmed
Scope: Surface depth, attachment and the connection to Effects and Motion; runtime stacking, backdrops and nested windows belong in Overlays.

Layers describe how close a surface feels to the person using the interface. The page is the common surface. A surface's level selects its visual profile; its owner determines where it belongs in an open window stack.

## Depth

### FND-LAYERS-01 — Choose a level by the surface's role

**MUST.** Assign each surface the level matching its role in the table below.

Why: depth communicates the relationship between a surface, the page and the task.

| Level | Role | Examples |
| --- | --- | --- |
| 0 | No elevation | Page background, ordinary content, flat controls such as Ghost buttons |
| 1 | Raised within the layout | Base/Outline buttons, input fields, raised cards |
| 2 | Brief description beside a control | Tooltip |
| 3 | A choice panel or supporting content beside a control | Dropdown, Popover, date picker, autocomplete |
| 4 | Independent notification | Alert popup, Toast |
| 5 | A task panel attached to a window edge | Drawer, side panel, bottom sheet |
| 6 | A detached surface taking over the task | Modal |

Dropdown belongs to level 3. Its ten current Figma variants use `shadow/elevation 3`, checked on 2026-10-11.

## Attachment

### FND-LAYERS-02 — Record attachment separately from depth

**MUST.** Record whether a surface stays in the layout, is attached to a control, is freely positioned against the viewport, or is attached to a window edge.

Why: depth selects the intensity of motion; attachment selects how the surface moves.

| Attachment | Relationship | Examples |
| --- | --- | --- |
| In layout | Keeps its place in normal content | Button, field, card |
| Control | Positioned against the element that opened it | Tooltip, Popover, Dropdown |
| Free | Positioned against the viewport without an edge connection | Toast, Modal |
| Window edge | Visually connected to an edge | Drawer, side panel, bottom sheet |

Modal can use translation and scale despite being above Drawer. Drawer uses edge movement because of its attachment, not because level 5 is an animation boundary (FND-MOTION-19, FND-MOTION-18).

## Visual profile and stacking

### FND-LAYERS-03 — Depth remains stable when a surface opens inside another

**MUST.** Keep a surface's level when it is opened by another surface.

Why: belonging to a window changes the order of presentation without changing the surface's role.

A Dropdown opened inside a Modal keeps level 3 and its visual profile while appearing above that Modal. A Tooltip inside that Dropdown keeps level 2. BEH-OVERLAYS-01 defines their presentation order.

### FND-LAYERS-04 — Effects and Motion derive from the assigned level

**MUST.** Select the surface's shadow and entry treatment through its level and attachment.

Why: choosing these independently makes the same surface communicate different depths.

FND-EFFECTS-05 maps levels to shadow styles. FND-MOTION-19 maps control-attached and free surfaces to spatial entry profiles; FND-MOTION-18 covers window-edge panels. Ordinary in-layout controls use their local state treatments under FND-MOTION-06.

### FND-LAYERS-05 — The component contract records level and attachment

**SHOULD.** Record the level and attachment in the component contract and cite the applicable Effects and Motion rules.

Why: design and code need the same classification without copying the shared rules.

## Related documents

- [Effects](effects.md): shadow composition and selection.
- [Motion](motion.md): transition parameters and profiles.
- [Overlays](../behavior/overlays.md): runtime stacking and ownership.
