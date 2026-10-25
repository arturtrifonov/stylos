# Input Text — DOM review, 2026-10-25

Initial scope: simplify Input Text as the reference for later field reviews.
Select and Text Area keep their current markup. Their shared width adapter
receives compatible refresh/cleanup support. Input Text public props, tokens
and form semantics are unchanged. Input Search was subsequently aligned in
[its own review](input-search-2026-10-25.md), including shared compact CSS.

## Removed

- The shared adornments div: the existing positioned field can position both
  side parts directly.
- The leading icon's additional inner span: one slot can provide measurement,
  decorative semantics and optical overhang.
- Empty leading and trailing groups: each optional part owns its elements.
  The trailing group stays mounted while any of its parts survives, so changing
  another property does not reparent the suffix or remaining icon.

Counts include the root and all descendant elements, including SVG/path:

| Configuration | Before | After |
| --- | ---: | ---: |
| Labelled field with no side parts | 7 | 4 |
| Labelled field with both supplied icons | 13 | 11 |

These are DOM counts, not a measured PageSpeed or rendering-time improvement.
The plain Svelte field also needs no ResizeObserver. Optional groups attach
measurement when present; cleanup removes stale padding overrides. Standalone
HTML consumers can call `update()` after changing group presence.

## Retained

- The outer root groups Label and the field with the density-dependent gap.
  It remains in the common structure when Label is hidden.
- The field container bounds the local surface and crossfading focus
  pseudo-elements. Moving them to the root would include Label; the native
  input retains the complete field footprint.
- Label is its native root with bare label text. The optional required marker
  and supporting message are separate content parts, not text wrappers.
- A supplied leading snippet needs one decorative/optical slot. The trailing
  cluster needs its shared measured row for suffix, validation and icon gaps.
- The trailing icon keeps its own optical slot within that row. Validation's
  slot also draws its local background. Suffix is a text part with separate
  typography and an accessible-description ID.

## Validation

- Unit coverage checks changing measured widths, optional group mount/removal,
  observer cleanup and removal of reserved-width overrides. Static previews
  use the same compact hierarchy and retain native label/form associations.
- Svelte checking, CSS lint, repository tests, documentation and Storybook
  production builds passed.
- UI verification passed for 46 core components and 3,081 server-rendered cases.
- Chromium compared before/after medium fields with both icons: the exact
  native field bounds, SVG bounds and 39/39 text padding remained unchanged.
- All five densities with both icons, suffix and error keep 24/32/40/48/56 field
  heights. Native input bounds equal field bounds; leading/trailing gaps match
  4/5/6/7/8. Hit testing over the leading icon reaches the native input.
- The suffix's measured width grew from 22.54 to 108.91 when its text changed;
  reserved padding updated accordingly. Its description ID remained associated.
- Read-only and disabled retain their distinct native attributes and suppress
  validation/message associations. Returning to editable restores the supplied
  outcome. Removing all side parts returns to four elements and clears inline
  reserved-width styles. Storybook's supplied value remains available through
  these changes.

The existing native `text-overflow: ellipsis` while unfocused and `clip` on
focus remain in the shared stylesheet. This review changes code structure;
it does not make a new Figma, screen-reader or whole-library browser-conformance
claim. Broader release acceptance remains in [0.3.0](0.3.0.md).
