# Alert Popup Timer implementation review — 2026-10-25

Reference: [owner-refined Figma set](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=4462-2998).
The set, all five variants, their token bindings and generated design context
were inspected after the owner's refinements. This records implementation
checks; the component contract is ready after the scoped
[alert and progress review](alerts-progress-2026-10-25.md). Release-wide checks remain open.

## Design agreement

| Size | Preview width | Default height | Padding / gap before progress | Counter, Undo and Close | Heading size / line height | Header cluster gap |
| --- | --- | --- | --- | --- | --- | --- |
| extra small | 400 | 68 | 12 | 24 | 14 / 14 | 6 |
| small | 420 | 82 | 14 | 32 | 16 / 16 | 8 |
| medium | 440 | 96 | 16 | 40 | 18 / 18 | 10 |
| large | 460 | 116 | 20 | 48 | 22 / 22 | 12 |
| extra large | 480 | 136 | 24 | 56 | 26 / 26 | 14 |

The browser measured the same default heights at these preview widths. Width
belongs to the surrounding layout; these are comparison fixtures, not fixed
component widths. An inset stroke preserves Figma's interior dimensions without
adding a border outside the authored padding. The surface uses the default
border, base background and elevation 4, matching FND-LAYERS-01.

The counter uses a subtle base background without a stroke, emphasis body text
and tabular lining figures. Heading block padding is 5 at every size.
Body typography follows text/base from extra small through extra large.
Header-to-content gaps are 8/8/10/12/14; content-stack gaps are 8/10/12/16/20.
The progress track remains 8 high with no visible label. Button Outline,
Button Inner, Icon and Progress Bar are reused. The Close SVG footprint was
measured at 24/32/40/48/56, matching the Figma asset dimensions.

The header-cluster wrapper implements the separate Close gap in all states.
Heading padding is applied directly to the paragraph. Close renders its native
Button Inner root directly, without an extra span. The progress wrapper
keeps the redundant time visualization outside accessibility announcements.

## Public contract and behavior

`size` replaces the legacy semantic `type`. The current design always has a
heading, so `hasHeading` is removed. `hasCloseButton` defaults to `false`.
`duration` and `remainingTime` are finite numeric seconds, both defaulting to 3.
Remaining time clamps to the duration; its ceiling supplies the visible count
and its precise fraction supplies Progress Bar. `timeUnit` defaults to empty;
the consumer may supply a localized suffix. `timerText` and `progressValue` are
removed so the number and track cannot drift apart. Product code owns elapsed
time, expiry, pause/resume and Undo's effects.

The heading alone carries the selected polite/assertive live role. Counter
updates and the hidden-label Progress Bar are outside it. This avoids announcing
the entire notification every second; it does not verify speech output in Orca.

## Validation

- Type and CSS checks, registry validation, unit tests, documentation and
  Storybook production builds passed.
- UI acceptance passed for 46 core components and 3,081 server-rendered cases.
- The default example is the only interactive story. It starts on user input,
  exposes duration, Start, Pause/Resume and Reset, and keeps the zero state visible.
  Undo stops the external clock; Close hides the alert only after a click.
- The previous Densities, Optional content, Review and automatic Interaction
  checks pages were removed after owner review. Component options and sizes
  remain available through Controls on the same countdown example.
- Earlier geometry checks covered all five sizes, ten optional-content
  combinations and keyboard actions. Current countdown checks cover progress,
  whole-second display, pause/resume, expiry, reset, Undo and dismissal. A 30-second
  run kept exactly the same fractional progress while paused, resumed on request,
  and stopped on Undo. A 1-second run reached a visible 0s/0% state; Close hid it
  and Reset restored it. An explicit s suffix stayed lowercase; omitting the unit
  displayed only the number.

Direct Firefox retesting, manual Orca evaluation and full-product accessibility
checks remain outside this component implementation review. The shared icon
preset remains Material Symbols Rounded; this work does not change the existing
library-wide icon reference decision.
