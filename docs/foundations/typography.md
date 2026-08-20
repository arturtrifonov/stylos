# Typography

Status: **Partially confirmed.** See master doc [§11](../master-document.md#11-typography-system) for the normative rules.

## Confirmed

- Canonical component size values are full words: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are shorthand in conversation only, never canonical Figma variant values (master doc [§11.2](../master-document.md#112-canonical-component-size-values), resolved by `stylos-naming-cleanup` v0.7 — see [docs/decisions/0002-skill-version-supersession.md](../decisions/0002-skill-version-supersession.md)).
- Font size binds to `Text Size / [measure]`; line height binds to `String Line Height / [measure]` (single-line content: labels, buttons, tabs, menu items, badges, compact values) or `Text Line Height / [measure]` (wrapping content: body copy, descriptions, messages). Font size and line height must always use the same measure.
- Default size→measure profiles exist for two architectural levels — **Element** ([§11.4](../master-document.md#114-element-text-profile)) and **Object** ([§11.5](../master-document.md#115-object-text-profile)). A documented component-specific mapping overrides its level's default profile.
- Component-wide text sizing targets exactly one **primary text role**, identified via the public text property, semantic layer name, and cross-variant consistency — not every text layer on the component.

## Open

- Final primary typeface, and whether a second accent face is used. Candidates considered: Manrope (leading candidate), Raleway (possible accent), PT Root UI, Commissioner, IBM Plex Sans (master doc [§11.1](../master-document.md#111-font-direction), [§27 item 2](../master-document.md#27-open-decisions)). Requirements: web-UI-suitable, sans serif with character, geometric/classical-compatible, variable where practical, free to use, strong Cyrillic support.
- Text-size profiles for architectural levels other than Element and Object (master doc [§27, item 11](../master-document.md#27-open-decisions)).

## TODO

- [ ] Confirm and license the primary typeface.
- [ ] Define profiles for any architectural level beyond Element/Object once those levels are confirmed to exist.
