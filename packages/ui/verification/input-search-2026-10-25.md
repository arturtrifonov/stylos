# Input Search — alignment review, 2026-10-25

Reference: Figma Components, Input Search 4833:15163; medium filled default
4833:15407. The inspected design includes text ellipsis, permanent Search and
Button Inner / Close before Search. Use the existing registered Search and
Close drawings; no copied Figma asset URLs or replacement drawings ship.

## Readiness

The owner approved Input Search as **ready** on 2026-10-25 after reviewing its
alignment with Input Text. The registry, generated documentation, workshop
controls and readiness regression now record that decision. The existing
Input Text contract stays ready. Historical import.ready is unchanged.

## Implementation

- Share Input Text's compact field CSS, native input geometry, label and hint
  associations, five densities, value binding, native form attributes, error
  handling, and unfocused ellipsis / focused scrolling.
- Default to medium and no placeholder, matching Input Text and current Figma.
- Keep Search permanently visible. Remove the draft-only hasTrailingIcon and
  trailingIcon props. Clear appears for a nonempty editable value before
  validation and Search; clearAccessibleName supports localization.
- Keep the field and input mounted in the same hierarchy in every state. The
  right row belongs to the common structure; each optional part owns only its
  own elements. No overlay, empty leading group, Clear slot, Search slot or
  value wrapper is needed. Native Button Inner and the Search SVG supply their
  own optical overhang; Label text remains unwrapped.
- The default labelled field uses seven elements including SVG/path, versus
  ten previously. Filled editable adds Button Inner's four elements. This is
  an element count, not a measured rendering performance claim.
- Use the shared ResizeObserver adapter for actual widths, including suffix
  edits, font loading, density changes and Clear mount/removal. Refresh when
  the leading group's presence changes; disconnect and clear reserves on
  removal. Disabled side colours work without the old overlay, including
  fields disabled through a fieldset.

## Validation

- Repository tests: 52 files pass. Coverage includes clear event order, empty
  values seen by callbacks, readonly/disabled guards, focus restoration,
  defaults, immutable Search, preview hierarchy and native button semantics.
- Svelte checking: zero errors and warnings. CSS lint and registry validation
  pass; registry's 192 existing judgement reports remain. Documentation and
  Storybook production builds pass.
- Current UI verification: 46 core components, 3,080 server-rendered cases.
- Chromium checks all five sizes: input and field height 24/32/40/48/56;
  Clear button and its SVG 12/14/16/18/20; Search SVG 16/20/24/28/32;
  trailing gaps 4/5/6/7/8. Typed value survives density changes in Storybook.
- The native form fixture confirms a clear click emits input then change;
  both callbacks see the empty bound and native value. It restores focus,
  removes Clear, retains Search and does not submit the form. Submit includes
  the empty query; native reset restores the original Components value and
  Clear. A disabled fieldset disables the input/button and hides Clear.
- An 800-character query keeps its complete value: text-overflow is clip
  while focused and ellipsis when blurred. Changing suffix text from items to
  Matching results expands measured right padding from 93.44 to 150.83 px.
  Its description stays associated. Hit testing over the leading SVG reaches
  the native input. Filled readonly/disabled keep their value and Search,
  suppress Clear and validation; returning to default restores Clear/error.
- Tab reaches the named Clear action with a visible focus ring; Space clears
  and restores input focus. Enter in Search submits the enclosing form with
  its query. Query execution remains the form consumer's responsibility.

## Migration and remaining release acceptance

The provisional trailing-icon props are removed: Search is permanent. A
consumer needing a configurable trailing decorative mark can use Input Text.
Set size to extra small and hasPlaceholder to true explicitly to retain the
former defaults. Clear now commits an empty bound value through input/change;
query execution remains the consumer's responsibility.

These targeted Chromium checks do not claim Firefox, screen-reader or
whole-release acceptance. Deferred checks remain in [0.3.0](0.3.0.md).
Ready does not publish a component or a release.
