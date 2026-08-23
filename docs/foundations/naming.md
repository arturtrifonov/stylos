# Naming and public API rules

**Normative.** The naming contract for components, layers, properties, and variants.

The operational contract is `stylos-naming-cleanup` **v0.7** ([`skills/src/naming-cleanup/SKILL.md`](../../skills/src/naming-cleanup/SKILL.md)). Where the skill states a more specific rule for its own operation, the skill governs — see [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7. This document states the contract the skill enforces; it does not restate the skill's procedure.

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

`/` is for library hierarchy only. Do not encode size, state, icon presence, or any other property as a slash hierarchy when a variant or component property can carry it.

The registry mirrors this hierarchy as a file path — `Table / TD Text` → `table/td-text.yaml` — and a component's `id` there must match its Figma name exactly ([registry README](../components/registry/README.md)).

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
| `tone` | `base`, `neutral`, `primary`, `info`, `success`, `warning`, `error`, `danger`, `inverted` | semantic visual meaning |
| `validation` | `off`, `error`, `warning`, `success` | form outcome |
| `checked` | `unchecked`, `checked`, `indeterminate` | checkbox / radio selection |
| `is expanded` | `false`, `true` | disclosure |
| `is filled` | `false`, `true` | filled-input state |

Do not use:

- `status` as an overloaded semantic/state property;
- `Static` for the base state — it is `default`;
- `Check State` — it is `checked`;
- camelCase such as `isOpen`, `isFilled`;
- Title Case property names or values.

### Size values

Canonical size values are **full words**: `extra small`, `small`, `medium`, `large`, `extra large`. `XS`/`S`/`M`/`L`/`XL` are conversational shorthand and never appear as Figma variant values. Enforced by `naming-cleanup` v0.7, which flags abbreviations as violations and maps them to the full words.

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

Where present, in this order:

1. `type`
2. `tone`
3. `style`
4. `size`
5. `density` ¹
6. `state`
7. `validation`
8. `checked`
9. `is filled`
10. `is expanded`
11. `orientation`
12. `alignment`
13. `position`
14. `icon position`
15. `arrows`
16. `angle`
17. `first link type`
18. component-specific properties

Only properties that exist are included. Rare component-specific properties sit at the end of their group.

¹ `density` holds a canonical position but has no confirmed definition — its meaning and use are unresolved ([`PLAN.md`](../../PLAN.md) 1.6). Do not introduce it on a new component until that is settled.

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
