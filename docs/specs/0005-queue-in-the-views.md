# SPEC 0005 — The queue in the views

**Status:** Built — 2026-08-29
**Date:** 2026-08-29

A work order. `PLAN.md` §9 stopped being a list of groups and became the milestones — the distribution decisions the library is worked towards ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §8). The reader and the two views still call them groups and still show them on one scale with the waves. This renames the concept through the code and separates the two axes on screen.

No change to what any milestone contains, and none to the registry schema.

---

## 1. Why

Three things are wrong now that §9 holds milestones.

**The vocabulary lies.** `parseGroups`, `groupById`, `entry.group`, a facet labelled Group. A group was a bag of related components; a milestone is a decision with a checklist under it. Code that keeps the old word will keep being read with the old meaning.

**One column carries two axes.** The Queue column shows `3` for a wave and `alpha` for a milestone, so a number and a name sit in the same cell and neither sorts against the other. They are not alternatives — every entry has a milestone, and some also have a wave. Two axes, two columns.

**The home page shows a third of the road.** It charts §4 and stops. The question it exists to answer — how far to the next decision — is about milestones, and no page answers it.

## 2. Scope

### In scope

- `tools/lib/plan.mjs`, `tools/build-registry-view.mjs`, `tools/build-home.mjs`, `tools/lint-registry.mjs` and their tests.
- The §9 table header in `PLAN.md`, and `tools/README.md` where it describes any of the above.

### Out of scope

- **What a milestone contains.** The four checklists are settled; this spec moves no component between them.
- **The registry schema.** No `milestone:` or `wave:` field is added — `ARCHITECTURE.md` §8 says why, and the reason has not changed.
- `import.batch`. It stays in the detail panel under its dated heading, as [0004](0004-registry-reconciliation.md) §3.4 left it.
- Estimates, dates, and any per-milestone ordering. A milestone has no order inside it until waves are cut for it.

## 3. The rename

`group` → `milestone`, in one pass, including the plan's own table header so that both sides move together:

| Now | After |
| --- | --- |
| `PLAN.md` §9 header `\| Group \| Unlocks \| Entries \|` | `\| Milestone \| The decision it opens \| Entries \|` |
| `parseGroups`, `groupMembers`, `groupById` | `parseMilestones`, `milestoneMembers`, `milestoneById` |
| the header regex in `parseGroups` | matches the new header |
| `entry.group` in the view payload | `entry.milestone` |
| the facet labelled "Group" | "Milestone" |
| the `plannedIds` comment "§9 groups" | "§9 milestones" |
| the validator's report text "nor §9 groups" | "nor §9 milestones" |

The §4 side keeps every name it has. Waves did not change.

## 4. The registry view

**Two columns where there is one.**

| Column | Value | Empty when |
| --- | --- | --- |
| Milestone | `0.1`, `alpha`, `beta`, `1.0`, `Parked` | never, once the plan places every entry |
| Wave | the number, `1`–`6` today | the entry's milestone has not been cut into waves |

An empty Wave cell is normal and means unsequenced, not missing. Say so in the column's `title`, in those words, so the blank does not read as a hole.

**Milestone is derived from §9 alone.** An entry in a §4 wave is in milestone `0.1` because §4 *is* the `0.1` checklist — so `0.1` does not list its members again in §9, and `milestoneById` returns `0.1` for anything a wave names. That is the one place the two tables meet, and it belongs in `plan.mjs`, not in each view.

**Sorting.** Default order: milestone in the plan's order, then wave ascending with blanks last, then name. Both columns stay sortable on their own.

**Two facets, not one.** They already exist; relabel them Milestone and Wave and leave them independent — filtering to wave 3 while no milestone is selected is a legitimate question.

**The detail panel** reads `PLAN.md §9, alpha` and, where there is one, `PLAN.md §4, wave 3`. Where there is no wave: `not yet cut into waves`.

## 5. The home page

Keep the wave section as it is. Add two things.

**A "you are here" line above it**, in one sentence built from the data: the first milestone that is not complete, the first wave that is not complete, and the counts behind both — for example *"Working towards 0.1 — wave 2 of 6, 13 of 29 components ready."* It is the first thing on the page because it is the question the page exists to answer.

**A milestone section below the waves.** One bar per milestone in the plan's order, labelled with the milestone and the decision it opens, filled by ready ÷ total, with the count and percent written beside it as the waves already do.

**The milestone bars do not share the waves' scale.** A wave bar's width is proportional to the wave's size, because waves are comparable units of work. A milestone is a checklist, not a quantity of work, and 43 against 8 says nothing worth reading. Every milestone bar is full width and only the fill differs. This is a deliberate difference between the two charts, not an inconsistency to tidy away.

`Parked` is not charted. Nothing waits on it, so a progress bar would imply something does.

## 6. Acceptance

1. No identifier, comment, label or test in the repository calls a §9 row a group.
2. `npm run registry:view` shows Milestone and Wave as separate columns and separate facets; every row has a milestone; rows outside `0.1` have no wave.
3. Sorting by Milestone puts the plan's order on screen, `Parked` last.
4. `npm run build:home` opens with the "you are here" sentence and draws one bar per milestone below the waves.
5. `PLAN.md` §9's header is `| Milestone | The decision it opens | Entries |` and the parser reads it; a build against the old header fails loudly rather than silently finding no milestones.
6. `npm run validate:registry` still reports an entry named by neither table, in the new wording.
7. Every test that mentioned a group is updated rather than deleted, and the suite passes.
