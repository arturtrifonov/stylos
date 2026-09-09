# Naming and public API rules

Status: Confirmed
Scope: The naming contract for components, layers, properties and variants; what a contract must contain is [components/STANDARD.md](../components/STANDARD.md).

**Normative.** `stylos-naming-cleanup` v0.9 ([`skills/src/naming-cleanup/SKILL.md`](../../skills/src/naming-cleanup/SKILL.md)) enforces these rules in Figma. It is derived from this document and never the reverse: where the two disagree, the skill is what has to change ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6). This document states the rules; it does not restate the skill's procedure.

Components are public APIs — see [charter](../charter.md). A name is part of that API: renaming one is a breaking change, not a tidy-up.

The section numbers are load-bearing: contracts, skills and `npm run validate:registry` cite this document as `naming.md §N`, so the eleven sections keep their numbers even as rules are added inside them.

---

## 1. General language

### FND-NAMING-01 — Library names and audit reports are English

**MUST.** Every name in the library, and every generated audit report, is in English.

Why: it is the repository's language throughout ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7), and a mixed-language layer tree cannot be searched with one query.

### FND-NAMING-02 — Every meaningful object is named, and never with a Figma default

**MUST.** Anything that means something carries a name, and no name is left as `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1` or `Variant 1`.

Why: a default name is indistinguishable from an unfinished layer, so nobody can tell which of the two they are looking at — and every skill that reads the tree has to treat both the same way.

Checked by: `stylos-naming-cleanup`.

### FND-NAMING-03 — Names describe role, never appearance

**MUST.** A name says what the thing is for, not what it looks like: not `Blue rectangle`, not `Grey line`, not `Big text`.

Why: an appearance name is wrong the first time a token moves, and it is wrong silently — the layer still exists, still renders, and now lies about itself.

Serves: PRN-04.

### FND-NAMING-04 — Equivalent layers keep one name across variants

**MUST.** A logical layer that appears in several variants carries the same name in all of them.

Why: it is what lets an override survive a variant switch, and what lets a skill compare variants at all — two names for one layer read as two different layers.

Checked by: `stylos-naming-cleanup`.

## 2. Components

### FND-NAMING-05 — Component names are Title Case with spaces

**MUST.** A component is named in Title Case with spaces: `Button` · `Icon Button` · `Text Field` · `Date Picker` · `Navigation Item`.

Why: one casing convention across the library is what makes a name predictable enough to be typed from memory in the Assets panel.

### FND-NAMING-06 — A property is never encoded as a slash hierarchy

**MUST.** `/` groups components in the Assets panel; size, state, icon presence and any other property a variant or component property can carry are never encoded as a slash path.

Why: a property in the path is a property no consumer can set — swapping it means swapping the whole instance, and the variant machinery that exists to make the change cheap is bypassed.

### FND-NAMING-07 — The last segment stands on its own

**MUST.** Where a slash group is used, the final segment is a name that means something alone; where it cannot be, the component takes a compound name instead — `Button Base`, `Button Hollow`.

Why: Figma names an instance after the last segment, so the rest of the path is gone the moment the component is placed — `Button / Base` becomes a layer called `Base`, which means nothing in a layer tree.

### FND-NAMING-08 — A slash group is a category, never containment

**MUST.** A component used inside another is not filed under it: `Tab Item` is a top-level component whether or not `Tabs` is the only thing that uses it.

Why: what is composed of what is recorded in the registry's `children` and `parents`, which is checkable. A folder name is not, and it goes stale the first time a second component reaches for the same part.

### FND-NAMING-09 — Prefer a compound name to a slash group

**SHOULD.** Where the two would say the same thing, `Accordion Header` is the name and `Accordion / Header` is not.

Why: a group buys one thing, a heading in the Assets panel, and charges for it in the registry path, in every reference that has to spell the path out, and in the reader's need to know that `Header` means the accordion's.

No registry entry carries a slash group: the twenty-one that did came from the 2026-08-20 import and were renamed on 2026-09-02.

### FND-NAMING-10 — Nested components stay public and unprefixed

**MUST.** A component used inside another is published under its own plain name: no `_` marker, no hiding, no prefix.

Why: publishing them is required for composition anyway, so a marker prevents nothing, and a name prefix lands in every nested instance and clutters the layer tree it is meant to help. Where a component is normally used inside another, say so in its Figma description — visible in the Assets panel and in Dev Mode, and free in the tree.

The registry mirrors this naming as a file path — `Table Cell Text` → `table-cell-text.yaml`, and `Foo / Bar` → `foo/bar.yaml` for a name that does carry a group — and a component's `id` there must match its Figma name exactly ([registry README](../components/registry/README.md)).

## 3. Layers

### FND-NAMING-11 — Layer names are sentence case and name the role

**MUST.** A layer is named in sentence case, describing its semantic role: `Label text` · `Leading icon` · `Content` · `Actions` · `Background` · `Divider` · `Focus ring`.

Why: the layer tree is read far more often than it is edited, and a role name is the only kind that stays true — appearance names are FND-NAMING-03's subject.

### FND-NAMING-12 — A text layer's name ends with `text`

**MUST.** Every text layer's name ends with the word `text`.

Why: it makes the text layers of a component findable without opening each one, which is what every audit of copy, of type binding and of the primary text role depends on.

Checked by: `stylos-naming-cleanup`.

## 4. Variant properties and values

### FND-NAMING-13 — Variant property names and values are lowercase

**MUST.** Both the name and the values of a variant property are lowercase.

Why: Figma treats `Size` and `size` as two properties, so casing drift produces a second axis nobody meant to create — and the value lists then have to be reconciled by hand.

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

### FND-NAMING-14 — A colour is not a state

**MUST.** `tone` names a colour; `state` and `validation` name a condition; they map many-to-one and never share a vocabulary.

Why: an input in the error state takes the `danger` colour — `error` is what happened, `danger` is what it looks like. A destructive button is `danger` too, and nothing about it is an error: deleting a record on purpose is not a failure. Give both the name `error` and the distinction collapses, leaving `tone="error"` meaning "red" — an appearance name wearing a semantic one.

Serves: PRN-04.

### FND-NAMING-15 — A `tone` value names a colour role the system has

**MUST.** Every `tone` value is the name of a colour role that exists.

Why: that is the whole rule — the kinds below are where those roles come from, not a closed list of permitted words.

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

**A component whose `tone` carries both kinds at once is a design question, not a naming one.** Indicator is being split for exactly that reason — `Indicator Status` for the semantic tones, a second component for the categorical hues ([`PLAN.md`](../../PLAN.md) Stage 4).

### FND-NAMING-16 — A mirrored role family is taken whole and unchanged

**MUST.** Where a component's tones mirror another role family, the values are that family's role names, all of them, unchanged, and the mirrored family is stated in the component's contract.

Why: some components are not objects with a colour but extensions of something that already has one — Badge is drawn as a continuation of text, so `tone = X` paints it with `text/X`. A mirror that renames a role, or offers a subset chosen by taste, is not a mirror: it is an ordinary tone list and answers to FND-NAMING-15. Naming the family in the contract is the only thing that makes the list legible.

This is also the only way a word that names a condition may be a tone value. `text/disabled` is a colour role; `disabled` names it; a component mirroring the text family therefore carries `tone = disabled` without contradicting FND-NAMING-14, because the value still names a colour role — the role's own name simply happens to be a condition. It is not licence to invent `tone = hover` on a component with no such role to mirror.

### FND-NAMING-17 — Canonical size values are full words

**MUST.** Size values are `extra small`, `small`, `medium`, `large`, `extra large`; `XS`/`S`/`M`/`L`/`XL` are conversational shorthand and never appear as Figma variant values.

Why: the abbreviations are ambiguous across products and unsortable, and two spellings of one value make every cross-component comparison a mapping exercise.

Checked by: `stylos-naming-cleanup` flags abbreviations as violations and maps them to the full words.

## 5. Text properties

### FND-NAMING-18 — A text property is named by role and ends in `text`

**MUST.** A text property carries the name of its role with `text` at the end: `label text` · `heading text` · `description text` · `helper text` · `placeholder text` · `button text`.

Why: the suffix is what tells a reader — and an agent — what kind of property they are looking at before they open it, exactly as `slot` does in FND-NAMING-24.

### FND-NAMING-19 — A property is never named after its sample content

**MUST.** A property is named for what it holds, never for the words currently in it.

Why: the sample is placeholder copy and changes with the next mockup; the name is API and cannot.

## 6. Boolean properties

### FND-NAMING-20 — A public boolean is `has [object]` or `is [state]`

**MUST.** Public booleans use exactly two forms — **`has [object]`** for optional anatomy (`has leading icon`, `has helper text`, `has divider`) and **`is [state]`** for a true/false condition (`is expanded`, `is selected`, `is loading`, `is read-only`).

Why: the two forms answer two different questions — *is this part present* and *what condition is this in* — and a single vocabulary for both hides which one a property is asking.

### FND-NAMING-21 — `show` is not a public property name

**MUST.** `show` does not appear in a public component API.

Why: it describes what the file does rather than what the component has, and it collides with `has` on exactly the cases where the distinction matters.

Exception: documentation and prototype controls — `show annotations`, `show measurements` — which are not part of any component's API.

## 7. Instance-swap and slot properties

### FND-NAMING-22 — An instance-swap property is named for the role it fills

**MUST.** An instance-swap property takes the lowercase name of the role it fills, with no suffix: `icon` · `leading icon` · `trailing icon` · `avatar` · `badge` · `prefix component` · `suffix component` · `empty state illustration`.

Why: swapping it changes which component sits in that one place, so the name has to say which place — not which component happens to be there today.

### FND-NAMING-23 — Prefer `leading`/`trailing` to `left`/`right`

**SHOULD.** Positional property names are written as `leading` and `trailing`.

Why: localization and RTL depend on it — `left` is a claim about the writing direction, and it is wrong in half the world's.

### FND-NAMING-24 — A slot property carries the `slot` suffix

**MUST.** A slot is named with the `slot` suffix: `content slot`, `cells slot`.

Why: the suffix names the kind of property, exactly as `text` does in FND-NAMING-18. Dropping it would leave a name that says nothing about what the property accepts — `content` could be a boolean, a text or one instance, and a slot is none of those: it takes however many instances the consumer puts in it, of several types. A reader who cannot tell a slot from an instance swap will fill it wrongly, and so will an agent.

## 8. Canonical variant-property order

### FND-NAMING-25 — Variant properties follow the canonical order

**MUST.** A component's variant properties are ordered as below; only properties that exist are included, and a property this list does not name sits at the end.

Why: **four positions are derived; the rest is convention.** The rule that derives them: a property that changes which values of another make sense stands above it. `type` decides what the thing is. `style` decides its treatment, and a treatment decides which tones are available — an outline and a fill do not offer the same set. `tone` decides nothing about size.

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

The derivation stops at position four. `state`, the condition booleans and arrangement invalidate nothing below them, so from `text case` down this is a settled order kept for consistency, not a conclusion. **Do not re-derive the convention band from the principle** — it does not reach it, and re-deriving it is how a list like this gets rewritten every six months to say the same thing.

`text case` heads the convention band because it is a treatment rather than a state — decided beside `tone`, but invalidating nothing, so it does not reach the derived band.

A property that plainly decides which values of a listed property make sense belongs in the derived band instead — a judgement recorded in the component's contract, not a change to this list.

## 9. Controlled property groups

### FND-NAMING-26 — A boolean's element properties immediately follow it

**MUST.** If a boolean controls an element's presence, every property for that element immediately follows the boolean, and no unrelated property splits the group.

Why: the boolean and the properties it turns on are one decision in the panel; anything between them makes the group invisible, and a consumer setting the element's tone cannot tell which boolean has to be on for it to matter.

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

**Adjacency is required inside a panel section, never across one.** Figma lists variant properties and component properties separately, so a group cannot span both: an element's variant-level setting — `icon position`, for one — keeps its place in §8 and does not join the group in §10. A rule demanding otherwise would be asking for something the tool cannot render.

**A boolean leads its element even when §10 names only the element.** Where §10 lists `placeholder text` and a component also exposes `has placeholder`, the boolean takes the element's position and the text follows it. This rule outranks §10's silence; an unnamed boolean is never left to find its own place.

Checked by: `npm run validate:registry` — a contract's `controls` group must be adjacent in `api` order.

## 10. Canonical non-variant property order

### FND-NAMING-27 — Non-variant properties follow the canonical panel order

**MUST.** A component's non-variant properties are ordered by the bands below, with controlled groups kept intact inside the order (FND-NAMING-26).

Why: **what the component says comes before what decorates it.** Text is what a component means: without it a heading is empty and a field has no name. An icon, an avatar, a badge are additions to something that already means something.

**This orders the Figma properties panel, not the contract.** Every property the panel shows has a place here, including one that exists only to draw a state in Figma — `has scrollbar` is the case. What a contract's `api` records is a different question and a smaller set ([`registry/README.md`](../components/registry/README.md)); a property being outside the API does not make it unplaced in the panel.

**The bands carry the reasoning; the entries carry the answer.** A band says why a property sits where it does, so a new one can be placed. The entries inside it are enumerated so that placing a rare property is a lookup rather than a judgement — a list that names only the obvious cases has solved the half nobody needed help with.

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

Notes worth not re-deriving:

- **The value comes before the hint.** `input text` is what the field holds; `placeholder text` is what stands in when it holds nothing. The reverse order was here until 2026-09-05 and was wrong.
- **A control that operates on the content sits with the content.** `has search` and `has back button` decide how a person reaches what is inside, so they belong beside it rather than among the icons or the closing actions. Select, Multiselect, Tree and the table all reach for them.
- **`has buttons` leads the row it controls**, by FND-NAMING-26 — a boolean that turns a group on stands above its members, never after them. `has close button`, `has clear button` and `has undo button` are their own affordances and not part of that row.
- **`is focused` is a condition, not a presentation**, though what it draws is a ring. It sits beside `is required` because that is how it reads, and it is the most common component property in the system — 21 of the contracted components carry it.

## 11. Placing a property this list does not name

### FND-NAMING-28 — An unnamed property is placed by band, never alphabetically

**MUST.** A property §10 does not name is placed by working the bands in this order, and alphabetical order is not a fallback:

1. **Choose the band** — what does the property do: name the thing, hold its content, operate on that content, accompany it, state its condition, act on it, or present it?
2. **Place it inside that band**, beside the entries it resembles.
3. **Bring its controlled group with it** (FND-NAMING-26).
4. **Add it to §10** when a second component reaches for it. A property one component has is its own; a property two components have is the system's, and leaving it unnamed means placing it twice by guesswork.

Why: alphabetical order groups nothing and is a way of not deciding — it puts `has scrollbar` between `has label` and `has search`, and a reader looking for how the component presents itself has to read the whole list.

---

## Relationship to the Svelte package

### FND-NAMING-29 — A prop name and its Figma property name are the same name

**MUST.** Component props in `@stylos/ui` map 1:1 onto the variant and component properties defined here; where a prop name and a Figma property name diverge, one of the two is wrong.

Why: that is a defect, not a translation. Two names for one property mean every consumer, every document and every skill has to know which side it is on ([`PLAN.md`](../../PLAN.md) Stage 5).

Behaviour comes from Zag.js ([decision 0002](../decisions/0002-frontend-stack.md)); anatomy and naming stay authored by Stylos.
