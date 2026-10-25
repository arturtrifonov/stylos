# Alerts and Progress Bar — scoped component review, 2026-10-25

Alert Inline, Alert Popup, Alert Popup Timer and Progress Bar are marked ready
following the owner's review of their designs, APIs and examples, and the final
documentation and DOM audit. This is component readiness for the next release;
it does not close [0.3.0 release acceptance](0.3.0.md) or publish a release.

## Documentation and representation

All four registry contracts have purpose, intended use, alternatives, public
properties/defaults, sizing, accessibility obligations, limitations and current
Figma references. Generated contract pages, Storybook Controls and package
README use these contracts. CHANGELOG records the API changes and migration.

Live Figma read-back on 2026-10-25 confirmed nonempty purpose/use descriptions
on all four sets: Inline `4462:2882`, Popup `1820:140371`, Timer `4462:2998`
and Progress Bar `3417:15594`. These descriptions match the registry's summary,
use-when and do-not-use-when prose. Inline and Popup each expose five sizes and
four semantic types; Timer exposes five sizes; Progress Bar exposes eleven
percentage examples plus unknown. Drawing-only timer text and discrete progress
examples are documented as differences from the controlled, continuous web APIs.

The source role of Popup and Timer is output, matching their notification
purpose. Neither is an activation trigger or modal dialog. Popup's stale code
surface level 6 was corrected to 4 after checking all twenty Figma variants,
which use `shadow/elevation 4`, matching FND-LAYERS-01.

## DOM audit

The review includes rendered child-component elements, not just Svelte tags.

- Removed the Close span from Inline, Popup and Timer. Button Inner's native
  button is the layout item. Inline/Popup use block margins to centre its square
  footprint on the first heading line; Timer sizes the button directly. Sizing
  selectors target only Close, so controls in consumer slots keep their sizes.
- The alert body groups heading, details and actions into one flexible column.
  The optional content container handles arbitrary multi-block snippets and
  their spacing. The action row provides independent wrapping and button gaps.
- The arbitrary decorative icon slot supplies a shared alignment box and
  `aria-hidden`. The known Close SVG uses the existing Button Inner icon slot.
- Timer's heading row separates Close from the counter/heading/Undo cluster,
  whose gap differs from the outer row. Both groups remain in every state.
  Its progress container applies `aria-hidden` to the redundant visualization;
  Progress Bar has no public ARIA forwarding property. The live heading stays
  outside that container and does not enclose the changing count.
- Progress Bar uses one permanent flex root, native progress and an optional
  label span. It has no separate track/fill wrappers. The root preserves common
  structure when the label is hidden and positions it beside the native track.

Optional parts disappear with their own elements; surviving siblings retain
their structure. No additional redundant wrapper was identified in this scope.

## Validation

- Registry validation, 51 repository test files, Svelte checking (zero errors
  and warnings), CSS lint, generated documentation and Storybook builds passed.
- Fresh UI acceptance: 46 core components, 3,081 server-rendered cases passed.
- Chromium checked all forty size/type combinations of Inline and Popup after
  Close removal: direct native button, first-line alignment and no horizontal
  overflow. Popup has level 4 throughout; Inline retains level 1.
- XS Popup before/after comparison kept the exact 116-unit root height and the
  same Close position and 20-by-20 footprint. All five Timer Close footprints
  match 24/32/40/48/56. The XL header can wrap when Close is enabled in the
  480-wide fixture; it grows naturally and centres controls on the heading.
- Timer's preceding [implementation review](alert-popup-timer-2026-10-25.md)
  records default five-size geometry, numeric time/progress, pause/resume,
  expiry, reset, Undo and dismissal. The current story starts only on request.

## Remaining release work

Manual Chrome/Orca speech output, contrast and the broader two-theme visual,
forced-colour, zoom and reduced-motion matrix remain in the release checklist.
Direct Firefox retesting of the reported 7.99999 progress-height measurement is
still open; no Firefox result is claimed. Fresh whole-library browser/axe output
and release-artifact fingerprints are also required by that checklist.

This read-back verified descriptions, public variant sets and alert elevation;
it was not a fresh exhaustive Figma component-integrity or naming-cleanup pass.
Those authoring checks and library publication remain part of Figma release
acceptance. Historical import.ready flags are unchanged and do not represent
current readiness. Six urgent starting-set contracts remain draft.
