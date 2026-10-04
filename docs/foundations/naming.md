# Naming and public API rules

Status: Draft
Scope: Public component names, property names and values across implementations; contract completeness is in [components/STANDARD.md](../components/STANDARD.md), and Figma authoring conventions are in [figma/naming.md](../../figma/naming.md).

**Normative.** These rules describe the public naming contract. An implementation follows them through its documented naming conversion; tool-specific authoring conventions and skill procedures are documented separately.

Components are public APIs — see [charter](../charter.md). A name is part of that API: renaming one is a breaking change, not a tidy-up.

The section numbers are cited from outside this file: contracts, skills and `npm run validate:registry` cite it as `naming.md §N`. So the eleven sections keep their numbers when rules are added inside them.

---

## 1. General language

### FND-NAMING-01 — Public names are English

**MUST.** Every public component and property name is in English.

Why: one language makes library names predictable and searchable across products and implementations.

### FND-NAMING-02 — Names describe role, never appearance

**MUST.** A name says what the thing is for, not what it looks like: not `Blue rectangle`, not `Grey line`, not `Big text`.

Why: an appearance name becomes wrong when a theme or token changes. A role name stays true across those changes and across implementations.

Serves: PRN-04.

## 2. Components

### FND-NAMING-03 — Component names are Title Case with spaces

**MUST.** A component is named in Title Case with spaces: `Button` · `Icon Button` · `Text Field` · `Date Picker` · `Navigation Item`.

Why: one casing convention across the library makes a name predictable enough to be searched or referenced from memory.

### FND-NAMING-04 — A nested component says so in its description

**MUST.** A component that is normally used inside another says so in its description.

Why: the description explains intended use without adding a marker to the component's name.

## 3. Implementation layer names

Layer-tree naming is an authoring convention of the implementation, not part of the public API. The Figma conventions are in [figma/naming.md](../../figma/naming.md#layer-names).

## 4. Variant properties and values

Here, a variant property is a public property with a defined set of alternative values, such as `size` or `tone`. It does not imply a component set in a particular design tool.

### FND-NAMING-05 — Variant property names and values are lowercase

**MUST.** Both the name and the values of a variant property are lowercase.

Why: `Size` and `size` look like two different identifiers. One casing convention prevents accidental duplicates and makes comparisons predictable.

This is the contract's vocabulary, not a required property set. Each contract states which properties and values the component offers. A condition can be represented by a boolean or a named variant value; its meaning does not depend on that choice. Independent conditions, such as focus and pointer interaction, can coexist.

| Property | Values | For |
| --- | --- | --- |
| `state` | `default`, `disabled`, `read only` | availability; pointer and focus states are derived by interactive code |
| `tone` | drawn from the colour vocabulary — see below | which semantic colour the component takes |
| `validation` | `off`, `error`, `warning`, `success` | form outcome |
| `is checked` | `false`, `true`, `mixed` | checkbox selection; radio uses only `false`, `true` |
| `is expanded` | `false`, `true` | disclosure |
| `is filled` | `false`, `true` | filled-input state |

Do not use:

- `status` as an overloaded semantic/state property;
- `Static` for the base state — it is `default`;
- `Check State` — it is `is checked`;
- camelCase such as `isOpen`, `isFilled`;
- Title Case property names or values.

Checked by: `stylos-naming-cleanup`.

### FND-NAMING-06 — A colour is not a state

**MUST.** `tone` says which colour a component takes, and `state` and `validation` say what condition it is in; a component never expresses one through the other.

Why: they are different dimensions. An input in the error state takes the `danger` colour: `error` is what happened, and `danger` is how it looks. A destructive button is `danger` too, and nothing about it is an error: deleting a record on purpose is not a failure. If a condition is written as a tone, `tone="error"` comes to mean "red" — an appearance name that looks like a semantic one.

The rule separates the properties, not their vocabularies. Where the same word is right on both sides — `warning` and `success` are both a validation outcome and a colour role — it is used on both, and no synonym is invented to keep the lists apart.

Serves: PRN-04.

### FND-NAMING-07 — A `tone` value names a colour role the system has

**MUST.** Every `tone` value is the name of a colour role that exists.

Why: that is the whole rule. The kinds below show where those roles come from; they are not a closed list of permitted words.

| Kind | Values | For |
| --- | --- | --- |
| semantic tones | `base`, `primary`, `info`, `success`, `warning`, `danger` | meaning — a primary action, an informational message, a destructive one |
| neutral hierarchy | `secondary`, `tertiary`, `inverted` | rank within neutral structure |
| palette hues by name | `slate`, `amber`, `violet`, … | categorical colour, per the hue-bound roles in [`color.md`](color.md) |
| a mirrored role family | that family's role names, all of them | a component drawn as an extension of something that already has a colour, rather than as an object of its own |

**Each component decides which of them it offers**, and a component built for categorical colour legitimately exposes the whole palette. Indicator Special does; that is not a violation, and no list of tone values anywhere is a whitelist that every component must satisfy.

Only one word is wrong as a tone:

| Not a `tone` | Why |
| --- | --- |
| `error` | a validation outcome, not a colour — the colour is `danger` |

`neutral` is a valid palette hue group like `slate` or `zinc`, and `surface/special/neutral` exists.

**A component whose `tone` carries semantic tones and categorical hues at once is a design question, not a naming one.** The Indicator family separates those purposes into `Indicator Status` and `Indicator Special`.

### FND-NAMING-08 — A mirrored role family is taken whole and unchanged

**MUST.** Where a component's tones mirror another role family, the values are all of that family's role names, unchanged.

Why: some components are not objects with a colour of their own; they extend something that already has one. Badge is drawn as a continuation of text, so `tone = X` paints it with `text/X`. A list that renames a role, or offers a subset chosen by taste, is not a mirror: it is an ordinary tone list, and FND-NAMING-07 applies to it.

A mirror can carry a word that also names a condition. `text/disabled` is a colour role, and `disabled` is its name, so a component that mirrors the text family carries `tone = disabled`. The value names a colour role, so the component still expresses its colour through `tone` and nothing else (FND-NAMING-06). This gives no permission to invent `tone = hover` on a component that has no such role to mirror.

### FND-NAMING-09 — A contract names the role family its tones mirror

**MUST.** Where a component's tones mirror a role family, its contract states which family.

Why: the values alone do not say where they come from. Naming the family in the contract is the only way a reader can understand the list.

### FND-NAMING-10 — Canonical size values are full words

**MUST.** Size values are `extra small`, `small`, `medium`, `large`, `extra large`; `XS`/`S`/`M`/`L`/`XL` are conversational shorthand and never appear as contract values.

Why: the abbreviations are ambiguous across products and cannot be sorted. With two spellings of one value, every comparison across components first needs a mapping between them.

Checked by: `stylos-naming-cleanup` flags abbreviations as violations and maps them to the full words.

## 5. Text properties

### FND-NAMING-11 — A text property is named by role and ends in `text`

**MUST.** A text property carries the name of its role with `text` at the end: `label text` · `heading text` · `description text` · `helper text` · `placeholder text` · `button text`.

Why: the suffix tells a reader, and an agent, what kind of property they are looking at before they open it, exactly as `slot` does in FND-NAMING-17.

A text property supplies textual content, such as a label or a message. A string identifying a resource is not a text property: `Icon.name` identifies a mark. The registry distinguishes these as `kind: text` and `kind: string`; both use string storage. The storage type does not decide the property's role.

### FND-NAMING-12 — A property is never named after its sample content

**MUST.** A property is named for what it holds, never for the words currently in it.

Why: the sample is placeholder copy and changes with the next mockup; the name is part of the API and cannot change.

## 6. Boolean properties

### FND-NAMING-13 — A public boolean is `has [object]` or `is [state]`

**MUST.** Public booleans use exactly two forms — **`has [object]`** for optional anatomy (`has leading icon`, `has helper text`, `has divider`) and **`is [state]`** for a true/false condition (`is expanded`, `is selected`, `is loading`, `is read-only`).

Why: the two forms answer two different questions: *is this part present?* and *what condition is this in?* A single vocabulary for both would hide which question a property asks.

### FND-NAMING-14 — `show` is not a public property name

**MUST.** `show` does not appear in a public component API.

Why: it describes what the file does rather than what the component has. It also conflicts with `has` in exactly the cases where that difference matters.

## 7. Component and slot properties

### FND-NAMING-15 — A component-valued property is named for the role it fills

**MUST.** A property holding a component takes the lowercase name of the role it fills, with no suffix: `icon` · `leading icon` · `trailing icon` · `avatar` · `badge` · `prefix component` · `suffix component` · `empty state illustration`.

Why: the property identifies a place in the component anatomy, independent of which component currently fills it.

### FND-NAMING-16 — Prefer `leading`/`trailing` to `left`/`right`

**SHOULD.** Positional property names are written as `leading` and `trailing`.

Why: localization and RTL depend on it. `left` is a claim about the writing direction, and in a right-to-left script it is wrong.

### FND-NAMING-17 — A slot property carries the `slot` suffix

**MUST.** A slot is named with the `slot` suffix: `content slot`, `cells slot`.

Why: the suffix distinguishes an area accepting several child components from a property holding one component. `content` alone could also mean a boolean or text. The name tells a consumer what kind of value the property accepts.

## 8. Canonical variant-property order

### FND-NAMING-18 — Variant properties follow the canonical order

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

### FND-NAMING-19 — A boolean's element properties immediately follow it

**MUST.** If a boolean controls an element's presence, every property for that element immediately follows the boolean, and no unrelated property splits the group.

Why: the boolean and the properties it turns on are one decision. Anything placed between them hides the group, and a consumer setting the element's tone cannot tell which boolean has to be on for that tone to have any effect.

Order inside a group:

1. `has [element]`
2. `[element]` — a component-valued property — or `[element] slot` — a slot (§7)
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

**The contract records the group.** Its `controls` list names the properties the boolean governs, and those properties are adjacent in `api`. An implementation may display the properties in separate sections; that display does not change the contract's group.

**A boolean comes before its element even when §10 names only the element.** Where §10 lists `helper text` and a component also exposes `has helper text`, the boolean takes the element's position and the text follows it. Where §10 says nothing about the boolean, this rule decides its place; a boolean that §10 does not name is never left to find its own place.

Checked by: `npm run validate:registry` — a contract's `controls` group must be adjacent in `api` order.

## 10. Canonical non-variant property order

### FND-NAMING-20 — Non-variant properties follow the canonical order

**MUST.** A component's non-variant properties are ordered by the bands below, with controlled groups kept intact inside the order (FND-NAMING-19).

Why: **what the component says comes before what decorates it.** Text carries a component's meaning: without it a heading is empty and a field has no name. An icon, an avatar or a badge is added to something that already has a meaning.

**This gives the relative order within the non-variant properties.** §8 does the same for variant properties. The two lists do not prescribe a single merged sequence, but a controlled group stays intact in `api` (FND-NAMING-19). Implementation-only controls are not public contract properties.

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

24. `is required`
25. `is sorted`
26. `is filtered`

**What can be done to it**

27. `has clear button`
28. `has close button`
29. `has buttons` → `has primary button` → `has secondary button` → `has tertiary button`
30. `has undo button`

**How it is presented**

31. `has background`
32. `has divider`
33. `has overflow`

**Its own**

34. component-specific properties

Notes on settled points, so that they are not re-derived:

- **The value comes before the hint.** `input text` is what the field holds; `placeholder text` is what is shown when it holds nothing. This list had the reverse order until 2026-09-05, and that order was wrong.
- **A control that operates on the content sits with the content.** `has search` and `has back button` decide how a person reaches what is inside, so they belong beside it rather than among the icons or the closing actions. Select, Multiselect, Tree and the table all use them.
- **`has buttons` comes before the row of buttons it controls**, by FND-NAMING-19: a boolean that turns a group on stands above its members, never after them. `has close button`, `has clear button` and `has undo button` are separate affordances and not part of that row.

## 11. Placing a property this list does not name

### FND-NAMING-21 — An unnamed property is placed by band, never alphabetically

**MUST.** A property §10 does not name is placed by following these steps in order, and alphabetical order is not a fallback:

1. **Choose the band** — what does the property do: name the thing, hold its content, operate on that content, accompany it, state its condition, act on it, or present it?
2. **Place it inside that band**, beside the entries it resembles.
3. **Bring its controlled group with it** (FND-NAMING-19).
4. **Add it to §10** when a second component uses it. A property that one component has belongs to that component; a property that two components have belongs to the system, and leaving it unnamed means it is placed twice by guesswork.

Why: alphabetical order groups unrelated properties. It puts `has divider` before `has label`, so a reader looking for content has to scan presentation controls too.

---

## Implementation property names

### FND-NAMING-22 — Implementation property names matched literally

**RETIRED** 2026-09-30. An implementation's prop name had to match the corresponding library property name literally.

Why: literal equality rejected the naming conversion already used by the code package. FND-NAMING-23 requires one-to-one correspondence with a documented conversion instead.

### FND-NAMING-23 — Public implementation props map to the contract

**MUST.** Map the public props of a code implementation one-to-one to the component's contract properties through a documented naming conversion.

Why: a property has one meaning across implementations, but its spelling can follow the target language or framework. A documented conversion keeps the correspondence predictable without creating a second contract.

## Implementation notes

The conversion used by `@stylos/ui` is documented in its [README](../../packages/ui/README.md#property-name-conversion) and implemented by [`tools/build-ui-types.mjs`](../../tools/build-ui-types.mjs).

The Figma representation, panel sections and tool limitations are documented in [figma/naming.md](../../figma/naming.md). These are implementation details, not rules of the design language.

Registry paths follow component names: `Table Cell Text` → `table-cell-text.yaml`, `Foo / Bar` → `foo/bar.yaml`. The identity mapping is documented in the [registry README](../components/registry/README.md). No entry currently carries a slash group; the imported entries that did were renamed to compound names on 2026-09-02.
