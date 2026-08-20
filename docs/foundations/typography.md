# Typography

Status: **Partially confirmed.** See master doc [§11](../master-document.md#11-typography-system) for the normative rules.

## Confirmed

- Canonical component size values are full words: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are shorthand in conversation only, never canonical Figma variant values (master doc [§11.2](../master-document.md#112-canonical-component-size-values), resolved by `stylos-naming-cleanup` v0.7 — see [docs/decisions/0002-skill-version-supersession.md](../decisions/0002-skill-version-supersession.md)).
- Font size binds to `Text Size / [measure]`; line height binds to `String Line Height / [measure]` (single-line content: labels, buttons, tabs, menu items, badges, compact values) or `Text Line Height / [measure]` (wrapping content: body copy, descriptions, messages). Font size and line height must always use the same measure.
- Default size→measure profiles exist for two architectural levels — **Element** ([§11.4](../master-document.md#114-element-text-profile)) and **Object** ([§11.5](../master-document.md#115-object-text-profile)). A documented component-specific mapping overrides its level's default profile.
- Component-wide text sizing targets exactly one **primary text role**, identified via the public text property, semantic layer name, and cross-variant consistency — not every text layer on the component.
- **Element and Object are the only levels that will ever have a shared size/text profile.** This is a permanent design boundary, not an unfinished feature — see [docs/decisions/0003-component-levels-and-size-grid-scope.md](../decisions/0003-component-levels-and-size-grid-scope.md). Widget- and Layout-level components vary too much in size to encode a shared rule (a Breadcrumbs widget and an Alert widget share nothing size-wise); their typography is documented per-component in `docs/components/`, not derived from a foundation profile. Primitive-level components (Icon, Badge, Loader…) have preferred sizes but no skill-enforced grid.

## Open

- Final primary typeface, and whether a second accent face is used. Candidates considered: Manrope (leading candidate), Raleway (possible accent), PT Root UI, Commissioner, IBM Plex Sans (master doc [§11.1](../master-document.md#111-font-direction), [§27 item 2](../master-document.md#27-open-decisions)). Requirements: web-UI-suitable, sans serif with character, geometric/classical-compatible, variable where practical, free to use, strong Cyrillic support.
- Whether Primitive-level "preferred sizes" get written down as a soft reference table anywhere. Not a shared grid (see above) — just currently undocumented.

## TODO

- [ ] Confirm and license the primary typeface.
- [ ] Optionally document Primitive-level preferred sizes as a non-normative reference table.
