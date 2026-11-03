# Expanded-core regression and incomplete axe checks, 2026-11-03

The first [0.3.0](0.3.0.md) acceptance run, against `master` at `31814e9`
(after the [wrapper review](wrappers-2026-10-26.md)). It covers two rows of the
hand-off: the fresh expanded-core regression and the incomplete axe checks. It
is not an Orca evaluation, a visual-parity review or a conformance claim, and
it promotes nothing.

## Inputs

- Node 24.21.0, npm 11.19.0, axe-core 4.14.0.
- Browser: the Claude desktop in-app Chromium on Linux x86_64, reporting
  Chrome 152.0.7977.167.
- Source fingerprint
  `eeda0a76b197284a7c7b78d99aeffbb16b2a923c845488603e34a0105a2dc1a5`; any later
  change to the package invalidates it, so the run is repeated on the release
  commit before 0.3.0 is cut.

## Automated evidence

Commands of the baseline's **Repeat the checks**, in its order, from `npm ci`:

- `npm test`: 536 tests pass; rules, registry (113 entries, 192 outstanding
  reports, none new), skills and tokens pass. `tokens:check` prints only the
  known `0.2.0`/`0.1.0` Figma exception.
- `lint:css`, `ui:check`, `ui:build`, `workshop:build` and `build` pass.
- `ui:verify`: 48 core components, 3,306 packaged SSR cases.
- Browser run: 6,612 of 6,612 renders across both themes, no runtime or render
  errors, no axe violations. `ui:verify:results` accepts the report.

## Incomplete axe checks

The run reports **14** incomplete checks, seven per theme, against 18 on
2026-10-17. Field contrast in Input Text, Input Search, Select and Text Area is
no longer among them: since the fields were restructured, axe resolves their
background and passes their text in both themes (2–3 nodes each, rerun on this
build). Switcher and Switcher Item are new, because the selected segment now
sits on the group's travelling `::after` surface.

Each remaining check was determined by hand in both themes, in the acceptance
page's Default composition. Contrast was computed from the computed text colour
and every background layer behind the text box — the element's ancestors and any
`::before`/`::after` that covers it — composited in sRGB, against 4.5:1 (no
case is large text).

| Component | axe could not determine | Light | Dark | Result |
| --- | --- | --- | --- | --- |
| Badge | contrast of a one-character count | 13.98:1 | 16.11:1 | passes |
| Switcher, selected segment | background drawn by the group's `::after` | 4.55:1 | 10.12:1 | passes |
| Switcher, unselected segments | the same pseudo-element, which does not cover them | 14.62:1 | 18.50:1 | passes |
| Switcher Item | as the selected segment | 4.55:1 | 10.12:1 | passes |
| Table Row Head, Table Row Body — header cells | background, because of the row's `::after` | 7.23:1 | 12.32:1 | passes |
| Dropdown, Select | whether `aria-controls` resolves on a trigger with `aria-haspopup` | — | — | resolves |

- **Table rows.** The row's `::after` is its 1 px bottom rule, 45 px down a
  46 px header row; the header text spans 11–35 px. It lies under no text, so
  the row's own surface is the background. Body-cell text was measured too:
  14.62:1 and 18.50:1.
- **Dropdown and Select.** axe 4.14.0 marks every `aria-controls` on an element
  with `aria-haspopup` for review whatever the DOM holds (`controlsWithinPopup`,
  `axe.js` line 31888), so this check can never pass automatically. On the
  `combobox` trigger the referenced `listbox` exists while closed and while
  open, `aria-expanded` follows it, and Escape closes it with focus back on the
  trigger.
- **The selected Switcher segment** is the system's bold base pair —
  `text-inverted` (`#f8fafc`) on `surface-bold-base-default` (`#60758a`) in
  light — which Button, Tag, Tag Interactive and Tooltip also use and which axe
  passes there. Nothing about it is specific to Switcher; only the pseudo-element
  hides it from axe. This record covers the Default (base) tone; the other tones
  belong to the visual and contrast review.

The determinations rest on this build's colours; axe will keep reporting the
same 14 as incomplete, and the next run is compared against this list rather
than read as new findings.

## First Orca pass — suspected findings

The owner ran part of an earlier Markdown checklist on 2026-11-03, from a
checkout of `codex/nested-dark-theme`, which branches from `b847cdb` (0.2.0)
and lacks 13 commits of `master` — the commands did not name the checkout to run
them in. Those results describe 0.2.0 and are not acceptance evidence. Each
report was re-examined on `31814e9` in Chrome's accessibility tree (headless
Chrome 156 over the DevTools protocol) and with real key presses. Nothing below
is decided until the walkthrough confirms it; the step that does is named.

**Owner decision, 2026-11-03:** the checks of that pass with no reported problem
are accepted and not repeated, although they ran on 0.2.0 markup; the #89
wrapper removal changed the DOM of most components after it. The walkthrough
repeats only the checks with a reported problem, those whose subject did not
exist in 0.2.0 (the native-form fields, the current Drawer) and checks added
since (S7, P9, the table's sorting and filtering).

| Report | On `31814e9` | Confirm in |
| --- | --- | --- |
| Browse-mode arrows stop on "blank" | Chrome exposes decorative pseudo-elements as unnamed objects: Switcher, Switcher Item and Switcher Item Icon (`::before` focus frame, `::after` selection surface), Toggle Input `::after`, Loader, Indicator Status and Special, Dropdown `::before`. The radio and Dropdown rows have none any more; their slot elements went in #89. | N5, D3, P3, C6, C8 |
| No visible focus on Clear Workspace | The focused Clear button (Button Inner) has its own ring suppressed by `select.css` in favour of the field's focus treatment; the screen is identical whether the field or Clear has focus. | S6 |
| Empty required Select | Submit returns focus to the field, but it keeps `aria-invalid="false"`. | S7 |
| Alert Popup Timer is not announced | Inline and Popup are themselves `role=status` and appear by losing `hidden`; Timer's live region is its heading inside a section that loses `hidden`, so it arrives with its text in place. | P8 |
| Focus after Undo | Undo removes its own button and focus falls to the page; the contract leaves focus to the host, and the composition does not move it. | P9 |
| Drawer focuses its content | After Close, Tab reaches the scrollable body region (`tabindex="0"`). | W2 |
| Table not navigable | The tree is a correct table; the checklist named the wrong keys. | C2 |
| Fields and buttons absent | They exist on `31814e9`; 0.2.0 had neither the native-form fields nor the current Drawer. | N6, N8, W1 |

Seen while preparing the walkthrough, not reported: once, after many remounts in
one page, Enter on the Dropdown controls trigger opened the popup without
moving focus into it; not reproduced on a fresh page or after plain remounts.
The walkthrough loads every step fresh. Text buttons reach Orca in their
rendered capitals ("SUBMIT"); N8 asks how Orca reads them.

## Not covered

Linux Chrome + Orca, visual comparison with Figma, the other Switcher tones and
states, field contrast outside the Default compositions (filled, placeholder,
disabled), zoom/reflow, forced colours, reduced motion, consumer compositions and
Figma synchronization remain open in the [hand-off](0.3.0.md).
