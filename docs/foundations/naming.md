# Naming and public API rules

Status: Draft
Scope: The naming contract for components, layers, properties and variants; what a contract must contain is [components/STANDARD.md](../components/STANDARD.md).

**Normative.** `stylos-naming-cleanup` v0.9 ([`skills/src/naming-cleanup/SKILL.md`](../../skills/src/naming-cleanup/SKILL.md)) enforces these rules in Figma. The skill is derived from this document, never the reverse: where the two disagree, the skill has to change ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6). This document states the rules; it does not restate the skill's procedure.

Components are public APIs — see [charter](../charter.md). A name is part of that API: renaming one is a breaking change, not a tidy-up.

The section numbers are cited from outside this file: contracts, skills and `npm run validate:registry` cite it as `naming.md §N`. So the eleven sections keep their numbers when rules are added inside them.

---

## 1. General language

### FND-NAMING-01 — Library names and audit reports are English

**MUST.** Every name in the library, and every generated audit report, is in English.

Why: it is the repository's language throughout ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7), and a mixed-language layer tree cannot be searched with one query.

### FND-NAMING-02 — Every meaningful object is named, and never with a Figma default

**MUST.** Anything that means something carries a name, and no name is left as `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1` or `Variant 1`.

Why: a layer with a default name looks exactly like an unfinished layer. Nobody can tell which of the two they are looking at, and every skill that reads the tree has to treat both the same way.

Checked by: `stylos-naming-cleanup`.

### FND-NAMING-03 — Names describe role, never appearance

**MUST.** A name says what the thing is for, not what it looks like: not `Blue rectangle`, not `Grey line`, not `Big text`.

Why: an appearance name becomes wrong the first time a token changes, and nothing shows that it is wrong. The layer still exists and still renders, but its name now describes something it no longer looks like.

Serves: PRN-04.

### FND-NAMING-04 — Equivalent layers keep one name across variants

**MUST.** A logical layer that appears in several variants carries the same name in all of them.

Why: one name is what keeps an override in place when the variant is switched, and what lets a skill compare variants at all. Two names for one layer read as two different layers.

Checked by: `stylos-naming-cleanup`.

## 2. Components

### FND-NAMING-05 — Component names are Title Case with spaces

**MUST.** A component is named in Title Case with spaces: `Button` · `Icon Button` · `Text Field` · `Date Picker` · `Navigation Item`.

Why: one casing convention across the library is what makes a name predictable enough to be typed from memory in the Assets panel.

### FND-NAMING-06 — A property is never encoded as a slash hierarchy

**MUST.** `/` groups components in the Assets panel, and size, state, icon presence and any other property that a variant or component property can carry are never encoded as a slash path.

Why: a consumer cannot set a property that is in the path. To change it they have to swap the whole instance, which bypasses the variants that exist to make that change cheap.

### FND-NAMING-07 — The last segment stands on its own

**MUST.** Where a slash group is used, the final segment is a name that means something on its own; where no such name is possible, the component takes a compound name instead — `Button Base`, `Button Hollow`.

Why: Figma names an instance after the last segment, so the rest of the path is lost as soon as the component is placed. `Button / Base` becomes a layer called `Base`, which means nothing in a layer tree.

### FND-NAMING-08 — A slash group is a category, never the parent component

**MUST.** A component used inside another is not filed under it: `Tab Item` is a top-level component whether or not `Tabs` is the only thing that uses it.

Why: the registry records which component is built from which, in `children` and `parents`, and that record can be checked. A folder name cannot be checked, and it becomes out of date the first time a second component uses the same part.

### FND-NAMING-09 — Prefer a compound name to a slash group

**SHOULD.** Where a compound name and a slash group would say the same thing, the compound name is used: `Accordion Header`, not `Accordion / Header`.

Why: a group gives one thing, a heading in the Assets panel. Its cost is paid in the registry path, in every reference that has to spell the path out, and by the reader, who has to know that `Header` means the accordion's header.

No registry entry carries a slash group: the twenty-one that did came from the 2026-08-20 import and were renamed on 2026-09-02.

### FND-NAMING-10 — Nested components stay public and unprefixed

**MUST.** A component used inside another is published under its own plain name: no `_` marker, no hiding, no prefix.

Why: nested components have to be published for composition anyway, so a marker prevents nothing. A name prefix appears in every nested instance and clutters the layer tree it is meant to help.

The registry mirrors this naming as a file path: `Table Cell Text` → `table-cell-text.yaml`, and, for a name that does carry a group, `Foo / Bar` → `foo/bar.yaml`. How a registry `id` relates to the Figma name is set in the [registry README](../components/registry/README.md).

### FND-NAMING-11 — A nested component says so in its Figma description

**MUST.** A component that is normally used inside another says so in its Figma description.

Why: the description is visible in the Assets panel and in Dev Mode, and it adds nothing to the layer tree. It carries what a name marker would have carried, without the clutter FND-NAMING-10 removes.

## 3. Layers

### FND-NAMING-12 — Layer names are sentence case and name the role

**MUST.** A layer is named in sentence case, describing its semantic role: `Label text` · `Leading icon` · `Content` · `Actions` · `Background` · `Divider` · `Focus ring`.

Why: the layer tree is read far more often than it is edited, and a role name is the only kind of name that stays true. Appearance names are covered by FND-NAMING-03.

### FND-NAMING-13 — A text layer's name ends with `text`

**MUST.** Every text layer's name ends with the word `text`.

Why: the suffix makes a component's text layers findable without opening each one. Every audit of copy, of type binding and of the primary text role depends on that.

Checked by: `stylos-naming-cleanup`.

## 4. Variant properties and values

### FND-NAMING-14 — Variant property names and values are lowercase

**MUST.** Both the name and the values of a variant property are lowercase.

Why: Figma treats `Size` and `size` as two properties, so a difference in casing creates a second variant property that nobody meant to create. The two value lists then have to be made to match by hand.

| Property | Values | For |
| --- | --- | --- |
| `state` | `default`, `hover`, `active`, `focus`, `disabled`, `read only` | interaction only |
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

Checked by: `stylos-naming-cleanup`.

### FND-NAMING-15 — A colour is not a state

**MUST.** `tone` says which colour a component takes, and `state` and `validation` say what condition it is in; a component never expresses one through the other.

Why: they are different dimensions. An input in the error state takes the `danger` colour: `error` is what happened, and `danger` is how it looks. A destructive button is `danger` too, and nothing about it is an error: deleting a record on purpose is not a failure. If a condition is written as a tone, `tone="error"` comes to mean "red" — an appearance name that looks like a semantic one.

The rule separates the properties, not their vocabularies. Where the same word is right on both sides — `warning` and `success` are both a validation outcome and a colour role — it is used on both, and no synonym is invented to keep the lists apart.

Serves: PRN-04.

### FND-NAMING-16 — A `tone` value names a colour role the system has

**MUST.** Every `tone` value is the name of a colour role that exists.

Why: that is the whole rule. The kinds below show where those roles come from; they are not a closed list of permitted words.

| Kind | Values | For |
| --- | --- | --- |
| semantic tones | `base`, `primary`, `success`, `warning`, `danger` | meaning — a primary action, a destructive one |
| neutral hierarchy | `secondary`, `tertiary`, `inverted` | rank within neutral structure |
| palette hues by name | `slate`, `amber`, `violet`, … | categorical colour, per the hue-bound roles in [`color.md`](color.md) |
| a mirrored role family | that family's role names, all of them | a component drawn as an extension of something that already has a colour, rather than as an object of its own |

**Each component decides which of them it offers**, and a component built for categorical colour legitimately exposes the whole palette. Indicator does; that is not a violation, and no list of tone values anywhere is a whitelist that every component must satisfy.

Only two words are wrong as a tone:

| Not a `tone` | Why |
| --- | --- |
| `error` | a validation outcome, not a colour — the colour is `danger` |
| `info` | the system has no such colour ([`color.md`](color.md)) |

`neutral` is not one of the two: it is a palette hue group like `slate` or `zinc`, and `surface/special/neutral` exists.

**A component whose `tone` carries semantic tones and categorical hues at once is a design question, not a naming one.** Indicator is being split for exactly that reason: `Indicator Status` for the semantic tones, and a second component for the categorical hues ([`PLAN.md`](../../PLAN.md) Stage 4).

### FND-NAMING-17 — A mirrored role family is taken whole and unchanged

**MUST.** Where a component's tones mirror another role family, the values are all of that family's role names, unchanged.

Why: some components are not objects with a colour of their own; they extend something that already has one. Badge is drawn as a continuation of text, so `tone = X` paints it with `text/X`. A list that renames a role, or offers a subset chosen by taste, is not a mirror: it is an ordinary tone list, and FND-NAMING-16 applies to it.

A mirror can carry a word that also names a condition. `text/disabled` is a colour role, and `disabled` is its name, so a component that mirrors the text family carries `tone = disabled`. The value names a colour role, so the component still expresses its colour through `tone` and nothing else (FND-NAMING-15). This gives no permission to invent `tone = hover` on a component that has no such role to mirror.

### FND-NAMING-18 — A contract names the role family its tones mirror

**MUST.** Where a component's tones mirror a role family, its contract states which family.

Why: the values alone do not say where they come from. Naming the family in the contract is the only way a reader can understand the list.

### FND-NAMING-19 — Canonical size values are full words

**MUST.** Size values are `extra small`, `small`, `medium`, `large`, `extra large`; `XS`/`S`/`M`/`L`/`XL` are conversational shorthand and never appear as Figma variant values.

Why: the abbreviations are ambiguous across products and cannot be sorted. With two spellings of one value, every comparison across components first needs a mapping between them.

Checked by: `stylos-naming-cleanup` flags abbreviations as violations and maps them to the full words.

## 5. Text properties

### FND-NAMING-20 — A text property is named by role and ends in `text`

**MUST.** A text property carries the name of its role with `text` at the end: `label text` · `heading text` · `description text` · `helper text` · `placeholder text` · `button text`.

Why: the suffix tells a reader, and an agent, what kind of property they are looking at before they open it, exactly as `slot` does in FND-NAMING-26.

### FND-NAMING-21 — A property is never named after its sample content

**MUST.** A property is named for what it holds, never for the words currently in it.

Why: the sample is placeholder copy and changes with the next mockup; the name is part of the API and cannot change.

## 6. Boolean properties

### FND-NAMING-22 — A public boolean is `has [object]` or `is [state]`

**MUST.** Public booleans use exactly two forms — **`has [object]`** for optional anatomy (`has leading icon`, `has helper text`, `has divider`) and **`is [state]`** for a true/false condition (`is expanded`, `is selected`, `is loading`, `is read-only`).

Why: the two forms answer two different questions: *is this part present?* and *what condition is this in?* A single vocabulary for both would hide which question a property asks.

### FND-NAMING-23 — `show` is not a public property name

**MUST.** `show` does not appear in a public component API.

Why: it describes what the file does rather than what the component has. It also conflicts with `has` in exactly the cases where that difference matters.

Exception: documentation and prototype controls — `show annotations`, `show measurements` — which are not part of any component's API.

## 7. Instance-swap and slot properties

### FND-NAMING-24 — An instance-swap property is named for the role it fills

**MUST.** An instance-swap property takes the lowercase name of the role it fills, with no suffix: `icon` · `leading icon` · `trailing icon` · `avatar` · `badge` · `prefix component` · `suffix component` · `empty state illustration`.

Why: swapping it changes which component sits in that one place, so the name has to say which place — not which component happens to be there today.

### FND-NAMING-25 — Prefer `leading`/`trailing` to `left`/`right`

**SHOULD.** Positional property names are written as `leading` and `trailing`.

Why: localization and RTL depend on it. `left` is a claim about the writing direction, and in a right-to-left script it is wrong.

### FND-NAMING-26 — A slot property carries the `slot` suffix

**MUST.** A slot is named with the `slot` suffix: `content slot`, `cells slot`.

Why: the suffix names the kind of property, exactly as `text` does in FND-NAMING-20. Without it, the name says nothing about what the property accepts. `content` could be a boolean, a text or one instance, and a slot is none of those: it takes as many instances as the consumer puts in it, of several types. A reader who cannot tell a slot from an instance swap will fill it wrongly, and so will an agent.

## 8. Canonical variant-property order

### FND-NAMING-27 — Variant properties follow the canonical order

**MUST.** A component's variant properties are ordered as below; properties the component does not have are left out, and a property this list does not name goes at the end.

Why: **four positions are derived; the rest is convention.** They are derived from one principle: a property that changes which values of another property make sense stands above it. `type` decides what the thing is. `style` decides its treatment, and the treatment decides which tones are available: an outline and a fill do not offer the same set. `tone` decides nothing about size.

**Derived:**

1. `type`
2. `style`
3. `tone`
4. `size`

**Convention:**

5. `text case`
6. `state`
7. `validation`
8. `is checked`
9. `is selected`
10. `is filled`
11. `is expanded`
12. `orientation`
13. `alignment`
14. `position`
15. `icon position`
16. `arrows`
17. `angle`
18. component-specific properties

The derivation stops at position four. `state`, the condition booleans and the arrangement properties invalidate nothing below them, so from `text case` down this is a settled order kept for consistency, not a conclusion drawn from the principle. The principle does not reach that band, so re-deriving the band from it produces nothing new — only a list rewritten every six months to say the same thing.

`text case` comes first in the convention band because it is a treatment rather than a state. It is decided alongside `tone`, but it invalidates nothing, so it does not belong in the derived band.

Exception: a property this list does not name, but which clearly decides which values of a listed property make sense, goes in the derived band instead of at the end; the component's contract records that judgement, and this list does not change.

## 9. Controlled property groups

### FND-NAMING-28 — A boolean's element properties immediately follow it

**MUST.** If a boolean controls an element's presence, every property for that element immediately follows the boolean, and no unrelated property splits the group.

Why: the boolean and the properties it turns on are one decision in the panel. Anything placed between them hides the group, and a consumer setting the element's tone cannot tell which boolean has to be on for that tone to have any effect.

Order inside a group:

1. `has [element]`
2. `[element]` — an instance swap — or `[element] slot` — a slot (§7)
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

**Adjacency is required inside a panel section, not across sections.** Figma lists variant properties and component properties separately, so a group cannot span both. An element's variant-level setting, such as `icon position`, keeps its place in §8 and does not join the group in §10. A rule that demanded otherwise would ask for something Figma cannot display.

**A boolean comes before its element even when §10 names only the element.** Where §10 lists `helper text` and a component also exposes `has helper text`, the boolean takes the element's position and the text follows it. Where §10 says nothing about the boolean, this rule decides its place; a boolean that §10 does not name is never left to find its own place.

Checked by: `npm run validate:registry` — a contract's `controls` group must be adjacent in `api` order.

## 10. Canonical non-variant property order

### FND-NAMING-29 — Non-variant properties follow the canonical panel order

**MUST.** A component's non-variant properties are ordered by the bands below, with controlled groups kept intact inside the order (FND-NAMING-28).

Why: **what the component says comes before what decorates it.** Text carries a component's meaning: without it a heading is empty and a field has no name. An icon, an avatar or a badge is added to something that already has a meaning.

**This orders the Figma properties panel, not the contract.** Every property the panel shows has a place here, including one that exists only to draw a state in Figma, such as `has scrollbar`. What a contract's `api` records is a different question and a smaller set ([`registry/README.md`](../components/registry/README.md)); a property that is outside the API still has a place in the panel.

**The bands give the reasoning; the entries give the answer.** A band says why a property sits where it does, so that a new property can be placed. The entries inside each band are listed one by one so that placing a rare property means looking it up rather than making a judgement. A list that names only the obvious cases covers only the cases nobody needed help with.

**What names it**

1. `has label` → `label text`
2. `has heading` → `heading text`
3. `has title` → `title text`
4. `has description` → `description text`

**What it holds**

5. `input text`
6. `has placeholder` → `placeholder text`
7. `prefix text`
8. `has suffix text` → `suffix text`
9. `helper text`
10. `has additional text` → `additional text`
11. `number text`
12. `cell text`
13. `tooltip text`
14. `has content` → `content slot`
15. `cells slot`

**What operates on the content**

16. `has search`
17. `has back button`

**What accompanies it**

18. `has leading icon` → `leading icon`
19. `has icon` → `icon`
20. `has trailing icon` → `trailing icon`
21. `has avatar` → `avatar`
22. `has badge` → `badge`
23. `has status indicator` → `status indicator`

**What condition it is in**

24. `is focused`
25. `is required`
26. `is sorted`
27. `is filtered`

**What can be done to it**

28. `has clear button`
29. `has close button`
30. `has buttons` → `has primary button` → `has secondary button` → `has tertiary button`
31. `has undo button`

**How it is presented**

32. `has background`
33. `has divider`
34. `has overflow`
35. `has scrollbar`

**Its own**

36. component-specific properties

Notes on settled points, so that they are not re-derived:

- **The value comes before the hint.** `input text` is what the field holds; `placeholder text` is what is shown when it holds nothing. This list had the reverse order until 2026-09-05, and that order was wrong.
- **A control that operates on the content sits with the content.** `has search` and `has back button` decide how a person reaches what is inside, so they belong beside it rather than among the icons or the closing actions. Select, Multiselect, Tree and the table all use them.
- **`has buttons` comes before the row of buttons it controls**, by FND-NAMING-28: a boolean that turns a group on stands above its members, never after them. `has close button`, `has clear button` and `has undo button` are separate affordances and not part of that row.
- **`is focused` is a condition, not a presentation**, even though what it draws is a ring. It sits beside `is required` because that is how it reads. It is also the most common component property in the system: 21 of the contracted components carry it.

## 11. Placing a property this list does not name

### FND-NAMING-30 — An unnamed property is placed by band, never alphabetically

**MUST.** A property §10 does not name is placed by following these steps in order, and alphabetical order is not a fallback:

1. **Choose the band** — what does the property do: name the thing, hold its content, operate on that content, accompany it, state its condition, act on it, or present it?
2. **Place it inside that band**, beside the entries it resembles.
3. **Bring its controlled group with it** (FND-NAMING-28).
4. **Add it to §10** when a second component uses it. A property that one component has belongs to that component; a property that two components have belongs to the system, and leaving it unnamed means it is placed twice by guesswork.

Why: alphabetical order groups nothing, and choosing it is a way of not deciding. It puts `has scrollbar` between `has label` and `has search`, so a reader looking for how the component presents itself has to read the whole list.

---

## Relationship to the Svelte package

### FND-NAMING-31 — A prop name and its Figma property name are the same name

**MUST.** Component props in `@stylos/ui` map 1:1 onto the variant and component properties defined here; where a prop name and a Figma property name diverge, one of the two is wrong.

Why: such a difference is a defect, not a translation. Two names for one property mean that every consumer, every document and every skill has to know which side it is on ([`PLAN.md`](../../PLAN.md) Stage 5).

Behaviour comes from Zag.js (decision 0002); anatomy and naming stay authored by Stylos.
