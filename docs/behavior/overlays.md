# Overlays

Status: Confirmed
Scope: Runtime stacking, ownership and implemented window behaviour; visual depth belongs in Layers. Broader overlay policies remain open below.

## Ownership and order

### BEH-OVERLAYS-01 — Child overlays appear above their owner

**MUST.** Place an overlay opened inside another surface above its owner and that owner's backdrop.

Why: a surface opened to continue the current task must remain visible and reachable.

For example, the order is Modal backdrop, Modal, its Dropdown, then a Tooltip opened by that Dropdown. Their visual levels remain those assigned by FND-LAYERS-01 and FND-LAYERS-03.

### BEH-OVERLAYS-02 — Sibling surfaces have a defined order

**MUST.** Order independent overlay groups by Layers level and place the most recently opened group above siblings at the same level.

Why: the order must follow shared rules rather than DOM insertion accidents.

An overlay group includes the owner's backdrop, surface and descendants. A child belongs to that group under BEH-OVERLAYS-01, even if its own visual level is lower. An older group's child does not escape above a newer sibling group.

### BEH-OVERLAYS-03 — The backdrop belongs to its surface

**MUST.** Place a backdrop immediately below its owner's surface and above the groups that owner covers.

Why: a backdrop separates the current task from the surfaces behind it without hiding its own controls or child overlays.

The presence of a backdrop does not alone define modality; blocking interaction and moving focus remain separate behaviour decisions.

### BEH-OVERLAYS-04 — Portaling preserves logical ownership

**MUST.** Preserve an overlay's owner and group when rendering it through a portal or the browser's top layer.

Why: moving a node to avoid clipping must not change which task it belongs to.

`z-index` is an implementation of this order, not a visual Layers number. CSS stacking contexts and the browser's top layer can limit which values are comparable; the implementation needs a shared ordering strategy for each rendering mechanism. See [MDN's stacking-context reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context).

## Open

- Modal and Drawer now coordinate their native window hosts and anchored children. A general manager for every overlay type and numeric stacking allocation remains open; independent anchored groups still use their existing adapter positioning.
- Modal uses native modality, containment and a shared scroll lock. Drawer is non-modal and preserves an unrelated page task's focus. The implementation is recorded in the [UI package guide](../../packages/ui/README.md#modal-and-drawer); product-specific initial-focus policies remain open.
- Anchored children consume Escape before their window; the top active window handles the next Escape. Closing an owner dismisses its descendants. Window outside-click dismissal is not implemented; a broader policy for other overlay types remains open.
- Positioning and viewport collision handling currently belong to component adapters; a shared policy will be decided when further anchored surfaces are implemented.
