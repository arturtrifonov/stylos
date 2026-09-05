---
name: stylos-description-sync
description: "Fill the Figma description of the selected components from their registry entries in the Stylos repository. For each selected component or component set, derive the registry path from the component's name, read that YAML file over the GitHub connector, compose the description from summary, use_when and do_not_use_when — both lists in full — and write it to descriptionMarkdown. Supports several selected components at once. Never authors a description: when no registry entry exists, or a required field is missing, stop for that component and report it."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.2
---

# Stylos Description Sync

Write each selected component's Figma description from its registry entry in the repository.

**The repository is the source. This skill is a transfer, not an author.** Everything it writes is a verbatim assembly of fields that already exist in a YAML file. It never composes text from what the component looks like, what its layers are called, what its variants are, or what a similar component says.

## Scope

Process the current selection.

| Selected | Target |
| --- | --- |
| Component set | the set |
| Component that is not a variant | the component |
| Variant inside a component set | its parent set — a variant does not get its own description |
| Instance | **refuse.** Name it in the report and tell the user to select the main component |
| Anything else | ignore, and list it in the report as skipped |

Several components at once is the normal case. Process each independently and completely: a failure on one never stops the others, and never causes anything to be written for the one that failed.

If nothing is selected, ask the user to select one or more components. Do not scan the page for candidates.

## The repository

```
repository  arturtrifonov/stylos
branch      master
directory   docs/components/registry/
```

**The connector reads GitHub, not a working copy.** Anything unpushed does not exist to this skill. If a file the user says exists is not found, the first thing to say is that it may not be pushed.

## Workflow, per selected component

### 1. Derive the registry path

From the component's Figma name:

1. split on ` / `;
2. lowercase each segment;
3. replace every run of characters outside `a–z0–9` with a single `-`, and trim leading and trailing `-`;
4. join the segments with `/`;
5. append `.yaml` and prefix `docs/components/registry/`.

| Figma name | Path |
| --- | --- |
| `Checkbox Input` | `docs/components/registry/checkbox-input.yaml` |
| `Input URL` | `docs/components/registry/input-url.yaml` |
| `Table Cell Text` | `docs/components/registry/table-cell-text.yaml` |
| `Button Icon Ghost` | `docs/components/registry/button-icon-ghost.yaml` |

**Every entry is currently flat.** Step 1 exists because the rule "the path follows from the `id`" is unconditional, not because a nested path is wanted: the twenty-one entries that carried a slash group were the 2026-08-20 import's shape and became compound names on 2026-09-02. A slash is not how this registry groups anything — `registry/README.md`, *Families*. If a selected component's Figma name still contains ` / `, that name is the stale side, not the registry.

### 2. Read the file

Fetch the derived path.

**If it is not there,** you may do exactly one more thing: list `docs/components/registry/` and look for a file whose `id` equals the component's Figma name exactly. If one exists, use it, and report the path mismatch as a finding — a component's path must follow from its `id`, so this is a defect in the repository worth naming.

If neither the derived path nor a matching `id` exists, **stop for this component.** Do not look for a similarly named file. Do not read another component's entry. Do not write anything.

Report it as: no entry matches this Figma name. **Add one sentence when the name contains ` / ` or otherwise looks like a pre-rename name:** the entry probably exists under a compound `id` and the component is still awaiting its rename in Figma (`PLAN.md` §4). Renaming the component is the fix. **Do not create an entry, do not guess the compound name, and do not write a description from a file whose `id` you had to reason your way to.**

### 3. Verify identity

The file's `id` must equal the component's Figma name exactly — same case, same spacing, same slashes. If it does not, **stop for this component** and report both strings side by side. A near match is a mismatch.

### 4. Check the required fields

Three fields are required:

- `summary`
- `use_when`, with at least one entry
- `do_not_use_when`, with at least one entry that has `text`

If any is missing or empty, **stop for this component** and report which one. Do not substitute another field, do not use `purpose` in place of `summary`, and do not write a partial description because one of the three is absent.

`purpose`, `limitations`, `api`, `sizing_model` and accessibility findings are **not** part of the description. They belong to the generated component page, which is where a component is studied; the description is what is read while a component is being chosen.

### 5. Compose

Markdown. One paragraph, then two labelled lists, separated by blank lines:

```
<summary>

**Use when**
- <every entry of use_when, one per line, in order>

**Do not use when**
- <text of every entry of do_not_use_when, one per line, in order>[ Use <instead> instead.]
```

**Both lists in full.** Figma preserves bold, lists and links in `descriptionMarkdown` (`figma/mcp-and-connectors.md`), and the reader that consumes the whole string — an agent choosing a component from the library — is the one this text exists for. A human scanning the Assets panel sees the first line or two, which is why `summary` stands alone at the top and carries no label.

**The `instead` sentence** is appended to a `do_not_use_when` entry only when its `instead` is present and not `null`.

- One name: `Use Popover instead.`
- A list: join with `, ` and ` or ` before the last — `Use Label or Alert instead.` A list means a family, and naming the family is the decision; it is not a shortlist for the reader to pick from.

**Bold labels and bullets are the skill's scaffolding. Everything else is verbatim.** Copy each field value exactly: do not shorten it, rewrite it, fix its punctuation, translate it, or add emphasis, links or line breaks inside it. If a sentence reads badly, that is a defect in the registry entry and belongs in the report, not in an edit made here.

Worked example, from `docs/components/registry/tooltip.yaml`:

```
A short description of another control, shown beside it while it is pointed at or focused.

**Use when**
- A control needs a few words of explanation that will not fit beside it — what an icon button does, what an abbreviation stands for, why a control is unavailable.
- The explanation is worth having but not worth the room it would take permanently.

**Do not use when**
- The content is interactive, or the reader needs to keep it open while they do something else. Nothing here survives the pointer leaving, so a link or a button inside it cannot be reached. Use Popover instead.
- The information is required to complete the task. A tooltip is unavailable on touch, invisible to anyone not hovering, and gone the moment attention moves — it can repeat what is needed but must not be the only place it is said. Use Label or Alert instead.
```

### 6. Write

**Always write `descriptionMarkdown`. Never write `description`.**

This is not a preference. Writing `description` sets `descriptionMarkdown` to empty, and since §5 now produces real markup, that silently flattens every list and every bold label — a loss nobody sees until they open the Assets panel. Writing `descriptionMarkdown` populates `description` with a flattened plain-text copy on its own, so nothing is lost in that direction. The rule and the measurement behind it are in [`figma/mcp-and-connectors.md`](../../../figma/mcp-and-connectors.md); `registry/README.md` states it too.

**Compare against `descriptionMarkdown`, never against `description`.** `description` is the flattened copy, so it can never equal the composed markdown, and comparing to it would make every run look like a change and write every time. A no-op write still lands in the file's version history.

Three cases:

| Current `descriptionMarkdown` | Do |
| --- | --- |
| empty | write |
| identical to the composed text | **write nothing.** Report as unchanged |
| non-empty and different | show the current text and the composed text, and **ask before overwriting.** Never replace a hand-written description silently |

Do not touch the component in any other way. No renaming, no property changes, no layer edits, no documentation link.

## Report

One row per selected object, in selection order:

| Component | Registry path | Result |
| --- | --- | --- |

Results: `written`, `unchanged`, `awaiting confirmation`, `skipped — no entry for this name`, `skipped — id mismatch`, `skipped — missing <field>`, `skipped — instance`, `skipped — not a component`.

Add any findings about the repository below the table: a path that did not follow from an `id`, a field whose text reads badly, an entry whose `id` no longer matches Figma. Keep a component still awaiting its Figma rename separate from a repository defect — the first is scheduled work, the second is a bug.

**Do not report success while any row is a skip.** State how many were written and how many were not, and why.

## What this skill never does

- Author a description, in whole or in part, from anything other than the three required fields.
- Write a partial description when a required field is missing.
- Substitute a different registry entry for a missing one, or infer a compound `id` from a stale Figma name.
- Write `description`.
- Create, edit or commit anything in the repository. It reads.
- Modify anything outside the selection.
- Translate. The repository is English and so is every description it produces.
