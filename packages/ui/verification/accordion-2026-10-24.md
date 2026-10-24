# Accordion — component review, 2026-10-24

Scope: Accordion and its composed Header, reviewed one component at a time.
The owner approved both Accordion and Accordion Header as ready on 2026-10-24,
after reviewing the implementation and its Figma representation. This scoped
readiness decision does not close the release-wide [0.3.0 acceptance](0.3.0.md)
or claim unperformed assistive-technology or contrast checks.

## References

- [Accordion](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut?node-id=4384-1292): all ten size/expansion variants and their slot geometry.
- [Accordion Header](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut?node-id=4381-718): property definitions, five default densities and leading/trailing arrow placement.
- [WAI-ARIA Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): native heading around the disclosure button and contextual heading level.

Existing typography bindings match the exported tokens; no Figma property is
needed for the web-only heading level. Added `is focused` to Accordion Header
using the existing shared Focus component in all 80 variants. A
[five-density focus review](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut?node-id=5500-417)
shows the result. The owner's `has top border` property is preserved; web
composition uses an adjacent-sibling selector instead. Both registry entries
record this comparison as `last_verified: 2026-10-24`.

## Findings and fixes

| Finding | Evidence | Result |
| --- | --- | --- |
| The registry classified Accordion as a toolbar. | The component groups a titled content section; its Header is the trigger. | Classify the enclosing component as a container. |
| The CSS border added to the authored outer inset. | XS collapsed measured 34 in the browser; Figma is 32, with a 24 header and an inside stroke. | Subtract the stroke from CSS padding; the outer inset remains the same. |
| The root omitted the header/body gap. | Figma gives the vertical layout its own size-dependent gap, separate from body padding. | Use a column flex layout with the existing gap tokens; the hidden body contributes no gap. |
| The optical adjustment was undefined for XS, S and M. | Browser XS chevron container measured zero width; Figma reserves 14 for its 16 icon. | Supply the existing optical-inset token as the fallback, retaining the larger-size overrides. |
| Trailing arrows overhung toward the text. | Figma anchors the trailing arrow to the start of its narrow container; leading arrows anchor to the end. | Match those edges with logical positioning, including RTL. |
| Medium body padding was conflated with its header/body gap. | The current Figma slot uses `gap/g-0_625`; its outer gap uses `gap/g-0_750`. | Record and preserve both bindings. |
| The section title was only a button. | It was absent from heading navigation. | Keep the button inside a permanent native heading; expose `headingLevel`, default `"3"`. |
| The independent preview omitted associations and referenced a missing panel for standalone Header. | It ignored the supplied IDs and always emitted `aria-controls`. | Match the component's heading/panel IDs and omit an unspecified standalone relationship. |
| Only the chevron pair was implemented. | Figma offers Expand More / Less, Add / Dash and Drop Down / Up swaps. | Add `expandIcon="chevron\|plus\|dropdown"` to both components and the independent preview. |
| String line height clipped title descenders. | The title's overflow box was as short as its line box. | Add token-based painting room with compensating negative block margins; preserve header geometry and horizontal ellipsis. |
| Consecutive sections doubled their common border. | Each root drew both block borders. | Suppress the next sibling's top stroke and compensate its inset; retain one divider. |
| The Densities example ignored controls. | The template supplied only size. | Forward icon position, glyph preset and optional decorative icon. |
| The built-in disclosure icon had an avoidable wrapper. | Its SVG is known and can participate directly in flex layout. | Remove the span and preserve the optical overhang with negative logical margins on the SVG; the optional arbitrary icon snippet keeps its own slot. |

Hover and press now use the shared micro/linear transition profile, with no
transition under reduced motion. The heading wrapper has a semantic purpose;
it is part of the common structure in both expansion states.

Content disclosure is immediate through native `hidden`, with no height,
opacity, padding or gap transition. The animation trial was removed after
owner review exposed unwanted load-time movement. The mounted body retains
form state and becomes inert and `aria-hidden` when collapsed.

The owner's screencast also showed the **Review** story's automatic interaction
check toggling the panel and typing on reload. **Review** is now passive;
those scripted interactions live in the separate **Interaction checks** story.

## Checked

- Registry validation, Svelte checking, CSS lint and the repository test suite.
- Storybook **Densities**: all five header and collapsed-root heights, outer
  inset, chevron width/edge, header/body gap and body vertical padding.
- Storybook **Densities** also checks that title text bounds fit their clipping
  box, including descenders; controls apply to every density.
- Storybook **Expand icons** checks all three collapsed/expanded glyph pairs
  and the single border between contiguous siblings.
- Storybook **Interaction checks**: heading/button association, panel ID, Space/Enter,
  focus order, skipped disabled disclosure, preserved input node/value across
  collapse and reopen, stable heading node and one change callback per activation.
- Passive **Review** reload: panel remains collapsed, change count stays zero,
  and both panel and root have zero transition duration. Manual Space/Enter
  toggling preserves typed content across collapse and reopen.
- Real browser Space/Enter/Tab input: disabled disclosure is skipped, typed
  content survives collapse/reopen, and keyboard focus activates the visible ring.

These story checks ran in the local Chromium preview. They are scoped component
checks, not a new whole-library accessibility assessment.

The owner accepted the reviewed changes for a pull request and explicitly
approved promoting both Accordion contracts from draft on 2026-10-24.

## Still to review

- Dark-theme contrast, forced colours, zoom/reflow and reduced-motion preference
  in their target environments; the CSS preference branch alone is not a test.
- Chrome/Orca output and broader release acceptance remain covered by the
  existing release checklist. No speech or braille result is claimed here.
