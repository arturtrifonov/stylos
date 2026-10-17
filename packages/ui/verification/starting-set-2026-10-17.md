# Starting-set expansion — draft integration, 2026-10-17

The owner added nine product components immediately and explicitly retained
draft contracts. The twelve registry entries include Accordion Header, Switcher
Item and Tab Item as dependencies. All remain `draft`; code exports, plan
membership and automated checks do not establish readiness.

## Reference and implementation boundaries

Current component sets in Stylos / Components were read on 2026-10-17, including
their property definitions, representative variants and screenshots. References
are linked from each contract. Five density presets were inspected for Accordion,
Alert Popup, Input Search, Switcher, Tabs Horizontal and Text Area. Inline and
Timer currently have one authored density. Supporting header/selection item
references were also inspected. Figma was not edited.

Legacy Inline/Timer button definitions and Progress typography are not carried
into the package as obsolete fonts or new raw tokens. Existing Stylos controls
and typography roles are composed. Placeholder icons remain consumer-configured.
Counter/value and visual-state mappings are documented in the draft contracts.
These are provisional translations, not a pixel-parity or conformance claim.

Timer is a controlled notification view: the host supplies remaining-time copy
and percentage and owns its clock, pausing, expiry, undo, persistence and focus
after dismissal. Its changing counter is outside the live heading. Tab panels
and their visibility/ID relationships are consumer-owned.

## Automated evidence

The expanded core has 46 entries. Packaged SSR constructs 2,319 configured cases;
both-theme browser rendering covers 4,638. Earlier baseline numbers in
[0.2.0.md](0.2.0.md) cover the prior set only.

- `npm test`: all 50 test files pass, including draft membership/completeness,
  independent previews, escaping and progress semantics.
- Registry, rules, skills and token checks pass. The registry contains 111
  entries with 186 reported judgements; these are not newly certified findings.
- CSS lint and Svelte checking pass; Svelte reports zero errors and warnings.
- Package, workshop and documentation builds pass.
- Fresh packaged SSR covers all 2,319 cases. Browser results recorded
  `2026-10-17T20:50:05.573Z` cover 4,638/4,638 renders in light/dark, zero rendering
  errors and zero detected axe violations. `ui:verify:results` accepts the report
  against the source/artifact fingerprint.
- 18 axe checks remain incomplete: the earlier seven per theme plus empty
  Input Search and Text Area contrast in each theme. These remain unresolved
  checks, not passing contrast results. Review filled text, placeholder text and
  actual backgrounds in both themes along with the baseline popup/table cases.

The browser is the Codex in-app Chromium engine on Linux x86_64, reporting Chrome
154.0.0.0. axe-core is 4.14.0. This is not an Orca evaluation or full-product
accessibility claim. Raw evidence is generated under `build/ui-release/`.

## Manual evaluation

The acceptance inspector exposes **Starting set form** with all nine product
components, native form submission/reset, disabled radio/tab options, a
disclosure body containing a search field, associated tab panels and notification
actions. Real browser input confirmed:

- Search and multiline notes accept input, the text counter updates, and native
  submission yields query, selected view and multiline notes.
- Radio ArrowRight skips disabled Archived and selects Grid. Reset restores
  List in both the bound value and actual native checked state, and clears the
  search/notes and counter. A user-triggered native reset requires deferred
  reconciliation after its default action.
- Tab ArrowRight skips Unavailable; Home/End select the first/last available
  tab. Tab from the selected tab reaches its visible labelled panel.
- Space opens Accordion and makes its body field available.
- Close hides Inline; Show notifications restores it. Undo invokes the host's
  handler and hides Timer in the integration example.
- Text Area extra-small geometry measures 68 high with 14/22 text after fixing
  a shared-field specificity conflict. The current nine-component composition
  was visually inspected in the browser against the selected Figma references,
  within the provisional translation boundaries described above.

Orca speech/braille,
full variant contrast, timing policies in the consuming product and full-product
accessibility remain unverified.
