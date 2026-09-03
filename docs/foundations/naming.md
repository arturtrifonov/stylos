# Naming and public API rules

**Normative.** The naming contract for components, layers, properties, and variants.

`stylos-naming-cleanup` v0.9 ([`skills/src/naming-cleanup/SKILL.md`](../../skills/src/naming-cleanup/SKILL.md)) enforces these rules in Figma. It is derived from this document and never the reverse: where the two disagree, the skill is what has to change ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6). This document states the rules; it does not restate the skill's procedure.

Components are public APIs — see [charter](../charter.md). A name is part of that API: renaming one is a breaking change, not a tidy-up.

---

## 1. General language

- English for library names and generated audit reports.
- Name every meaningful object.
- No Figma defaults: `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1`, `Variant 1`.
- Role-based names over appearance-based names.
- Equivalent logical layers keep the same name across variants.

## 2. Components

Title Case with spaces.

`Button` · `Icon Button` · `Text Field` · `Date Picker` · `Navigation Item`

`/` groups components in the Assets panel. Do not encode size, state, icon presence, or any other property as a slash hierarchy when a variant or component property can carry it.

**The last segment must be a name that stands on its own.** Figma names an instance after the last segment, so the rest of the path is gone the moment the component is placed: `Button / Base` becomes a layer called `Base`, which means nothing in a layer tree. Where the last segment cannot stand alone, use a compound name instead — `Button Base`, `Button Hollow`.

**A slash group is a category, never a claim about containment.** A component used inside another is not filed under it: `Tab Item` is a top-level component whether or not `Tabs` is the only thing that uses it. What is composed of what is recorded in the registry's `children` and `parents`, which is checkable; a folder name is not.

**Prefer a compound name to a slash group.** A group buys one thing, a heading in the Assets panel, and charges for it in the registry path, in every reference that has to spell the path out, and in the reader's need to know that `Header` means the accordion's. Where the two would say the same thing, `Accordion Header` is the name and `Accordion / Header` is not. No registry entry carries a slash group: the twenty-one that did came from the 2026-08-20 import and were renamed on 2026-09-02.

**Components used inside other components stay public and unprefixed.** No `_` marker, no hiding. Publishing them is required for composition anyway, so a marker prevents nothing, and a name prefix lands in every nested instance and clutters the layer tree it is meant to help. Where a component is normally used inside another, say so in its Figma description — that is visible in the Assets panel and in Dev Mode, and costs nothing in the tree.

The registry mirrors this naming as a file path — `Table Cell Text` → `table-cell-text.yaml`, and `Foo / Bar` → `foo/bar.yaml` for a name that does carry a group — and a component's `id` there must match its Figma name exactly ([registry README](../components/registry/README.md)).

## 3. Layers

Sentence case, describing semantic role.

`Label text` · `Leading icon` · `Content` · `Actions` · `Background` · `Divider` · `Focus ring`

**Text layers must end with `text`.**

No appearance names: not `Blue rectangle`, not `Grey line`, not `Big text`.

## 4. Variant properties and values

Lowercase, both names and values.

| Property | Values | For |
| --- | --- | --- |
| `state` | `default`, `hover`, `active`, `focus`, `disabled` | interaction only |
| `tone` | drawn from the colour vocabulary — see below | which semantic colour the component takes |
| `validation` | `off`, `error`, `warning`, `success` | form outcome |
| `is checked` | `false`, `true`, `mixed` | checkbox / radio selection |
| `is expanded` | `false`, `true` | disclosure |
| `is filled` | `false`, `true` | filled-input state |

Do not use:

- `status` as an overloaded semantic/state property;
- `Static` for the base state — it is `default`;
- `Check State` — it is `is checked`;
- camelCase such as `isOpen`, `isFilled`;
- Title Case property names or values.

### A colour is not a state

**`tone` names a colour. `state` and `validation` name a condition. They map many-to-one, and they never share a vocabulary.**

An input in the error state takes the `danger` colour: `error` is what happened, `danger` is what it looks like. A destructive button is `danger` too, and nothing about it is an error — deleting a record on purpose is not a failure. Give both the name `error` and the distinction collapses: `tone="error"` ends up meaning "red", an appearance name wearing a semantic one.

### What a `tone` value may be

**A `tone` value names a colour role the system has.** That is the whole rule. The kinds below are where those roles come from, not a closed list of permitted words:

| Kind | Values | For |
| --- | --- | --- |
| semantic slots | `base`, `primary`, `success`, `warning`, `danger` | meaning — a primary action, a destructive one |
| neutral hierarchy | `secondary`, `tertiary`, `inverted` | rank within neutral structure |
| palette hues by name | `slate`, `amber`, `violet`, … | categorical colour, per the hue-bound roles in [`color.md`](color.md) |
| a mirrored role family | that family's role names, all of them | a component drawn as an extension of something that already has a colour, rather than as an object of its own |

**Which of them a component offers is the component's own business**, and a component built for categorical colour legitimately exposes the whole palette. Indicator does; that is not a violation, and no list of tone values anywhere is a whitelist every component must satisfy.

Only two words are wrong as a tone:

| Not a `tone` | Why |
| --- | --- |
| `error` | a validation outcome, not a colour — the colour is `danger` |
| `info` | the system has no such colour ([`color.md`](color.md)) |

`neutral` is neither: it is a palette hue group like `slate` or `zinc`, and `surface/special/neutral` exists.

#### Mirroring a role family

Some components are not objects with a colour but extensions of something that already has one. Badge is the case: it is drawn as a continuation of text, so its surface takes the **text** roles one for one — `tone = X` paints it with `text/X` — and its tone list is that family's list rather than a selection from the vocabulary above.

Where that is the design, the rule is mechanical: **the values are the family's role names, all of them, unchanged.** A mirror that renames a role, or offers a subset chosen by taste, is not a mirror — it is an ordinary tone list and answers to the vocabulary above. State the mirrored family in the component's contract, because it is the only thing that makes the list legible.

This is also the only way a word that names a condition may be a tone value. `text/disabled` is a colour role; `disabled` names it; a component mirroring the text family therefore carries `tone = disabled` without contradicting *A colour is not a state* above, because the value still names a colour role — the role's own name simply happens to be a condition. It is not licence to invent `tone = hover` on a component with no such role to mirror.

**A component whose `tone` carries both kinds at once is a design question, not a naming one.** Indicator is being split for exactly that reason — `Indicator Status` for the semantic tones, a second component for the categorical hues ([`PLAN.md`](../../PLAN.md) Stage 4).

### Size values

Canonical size values are **full words**: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are conversational shorthand and never appear as Figma variant values. Enforced by `naming-cleanup`, which flags abbreviations as violations and maps them to the full words.

## 5. Text properties

Named by role, ending in `text`:

`label text` · `heading text` · `description text` · `helper text` · `placeholder text` · `button text`

Never name a property after its sample content.

## 6. Boolean properties

Public booleans use exactly two forms:

- **`has [object]`** — optional anatomy: `has leading icon`, `has helper text`, `has divider`
- **`is [state]`** — a true/false state: `is expanded`, `is selected`, `is loading`, `is read-only`

`show` is not permitted in a public component API. It is allowed only on documentation or prototype controls — `show annotations`, `show measurements`.

## 7. Instance-swap properties

Role-based, lowercase:

`icon` · `leading icon` · `trailing icon` · `avatar` · `badge` · `prefix component` · `suffix component` · `empty state illustration`

Prefer `leading`/`trailing` over `left`/`right` — localization and RTL depend on it.

## 8. Canonical variant-property order

**A property that changes the meaning of what is below it comes first.** Changing `type` changes which tones make sense; changing `tone` does not change which sizes exist; changing `state` changes nothing below it. Arrangement is last because nothing depends on it. A property not listed below finds its place by asking what its change would invalidate.

Where present, in this order:

1. `type`
2. `tone`
3. `style`
4. `size`
5. `state`
6. `validation`
7. `is checked`
8. `is filled`
9. `is expanded`
10. `orientation`
11. `alignment`
12. `position`
13. `icon position`
14. `arrows`
15. `angle`
16. `first link type`
17. component-specific properties

Only properties that exist are included. Rare component-specific properties sit at the end of their group.

## 9. Controlled property groups

**If a boolean controls an element's presence, every property for that element immediately follows the boolean.** No unrelated property may split the group.

Order inside a group:

1. `has [element]`
2. `[element]` — instance swap or slot
3. `[element] text`
4. `[element] type`
5. `[element] tone`
6. `[element] size`
7. `[element] position`
8. rare element-specific settings

Examples:

- `has leading icon` → `leading icon` → `leading icon tone` → `leading icon size`
- `has close button` → `close button icon` → `close button label text` → `close button type`
- `has additional text` → `additional text` → `additional text tone`

## 10. Canonical non-variant property order

Controlled groups stay intact within this order:

1. `has leading icon` → `leading icon`
2. `has icon` → `icon`
3. `has trailing icon` → `trailing icon`
4. `has avatar` → `avatar`
5. `has badge` → `badge`
6. `has status indicator` → `status indicator`
7. `has label` → `label text`
8. `has heading` → `heading text`
9. `has title` → `title text`
10. `has description` → `description text`
11. `placeholder text`
12. `input text`
13. `helper text`
14. `has additional text` → `additional text`
15. `number text`
16. `has content` → `content`
17. `has active page` → `active page text`
18. `is required`
19. `has close button`
20. `has primary button`
21. `has secondary button`
22. `has tertiary button`
23. `has buttons`
24. `has undo button`
25. `has overflow`
26. `has item 1` … `has item 5`
27. `has page 2` … `has page 6`
28. rare component-specific properties

If a listed optional action exposes its own instance, text, type, tone, size, or position settings, those stay immediately after its controlling boolean, per §9.

## 11. Rare-property fallback

When no canonical position exists:

1. keep the property in the correct top-level group;
2. place it after the known properties in that group;
3. order multiple rare properties by anatomy or user-facing importance;
4. fall back to alphabetical only when anatomy gives no useful order.

Do not create a global canonical position for a property that appears once or twice.

---

## Relationship to the Svelte package

Component props in `@stylos/ui` are intended to map 1:1 onto the variant and component properties defined here — see [`PLAN.md`](../../PLAN.md) Stage 5 for the planned approach. Whatever supplies interaction behaviour, anatomy and naming stay authored by Stylos. Where a prop name and a Figma property name diverge, one of the two is wrong — that is a defect, not a translation ([`PLAN.md`](../../PLAN.md) Stage 5).
