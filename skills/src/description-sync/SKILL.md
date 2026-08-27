---
name: stylos-description-sync
description: "Fill the Figma description of the selected components from their registry entries in the Stylos repository. For each selected component or component set, derive the registry path from the component's name, read that YAML file over the GitHub connector, compose the description from summary, use_when and do_not_use_when, and write it. Supports several selected components at once. Never authors a description: when no registry entry exists, or a required field is missing, stop for that component and report it."
metadata:
  owner: Artur Trifonov
  system: Stylos Design System
  version: 0.1
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
repository  wrgraff/stylos
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
| `Table / TD Text` | `docs/components/registry/table/td-text.yaml` |
| `Accordion / Container` | `docs/components/registry/accordion/container.yaml` |

### 2. Read the file

Fetch the derived path.

**If it is not there,** you may do exactly one more thing: list `docs/components/registry/` and its subdirectories and look for a file whose `id` equals the component's Figma name exactly. If one exists, use it, and report the path mismatch as a finding — a component's path must follow from its `id`, so this is a defect in the repository worth naming.

If neither the derived path nor a matching `id` exists, **stop for this component.** Do not look for a similarly named file. Do not read another component's entry. Do not write anything. Report: no registry entry.

### 3. Verify identity

The file's `id` must equal the component's Figma name exactly — same case, same spacing, same slashes. If it does not, **stop for this component** and report both strings side by side. A near match is a mismatch.

### 4. Check the required fields

Three fields are required:

- `summary`
- `use_when`, with at least one entry
- `do_not_use_when`, with at least one entry that has `text`

If any is missing or empty, **stop for this component** and report which one. Do not substitute another field, do not use `purpose` in place of `summary`, and do not write a two-line description because the third field is absent.

### 5. Compose

Exactly three paragraphs, separated by a blank line:

```
<summary>

Use when: <first entry of use_when>

Do not use when: <text of the first entry of do_not_use_when>[ Use <instead> instead.]
```

The final sentence is appended only when that entry's `instead` is present and not `null`.

Worked example, from `docs/components/registry/checkbox-label.yaml`:

```
A checkbox with a short single-line label, sized by its text.

Use when: The option is a phrase that sits on one line, and the component may take whatever width its text needs.

Do not use when: The text wraps, or the row must occupy a fixed column width — the label would either force the component wider than its container or truncate. Use Checkbox Text instead.
```

**Copy the field values verbatim.** Do not shorten them, rewrite them, fix their punctuation, translate them, or add markdown emphasis. If a sentence reads badly, that is a defect in the registry entry and belongs in the report, not in an edit made here.

Only the first entry of each list is used. The rest exist for the generated component page and are not part of the description.

### 6. Write

Write to the component's description, preferring the field that preserves Markdown where the editor offers both. The composed text carries no markup, so nothing is lost either way — but writing the plain field where a Markdown field exists can silently empty the Markdown one, so prefer the Markdown field as a habit.

Three cases:

| Current description | Do |
| --- | --- |
| empty | write |
| identical to the composed text | **write nothing.** Report as unchanged — a no-op write still lands in the file's version history |
| non-empty and different | show the current text and the composed text, and **ask before overwriting.** Never replace a hand-written description silently |

Do not touch the component in any other way. No renaming, no property changes, no layer edits, no documentation link.

## Report

One row per selected object, in selection order:

| Component | Registry path | Result |
| --- | --- | --- |

Results: `written`, `unchanged`, `awaiting confirmation`, `skipped — no registry entry`, `skipped — id mismatch`, `skipped — missing <field>`, `skipped — instance`, `skipped — not a component`.

Add any findings about the repository below the table: a path that did not follow from an `id`, a field whose text reads badly, an entry whose `id` no longer matches Figma.

**Do not report success while any row is a skip.** State how many were written and how many were not, and why.

## What this skill never does

- Author a description, in whole or in part, from anything other than the three required fields.
- Write a partial description when a required field is missing.
- Substitute a different registry entry for a missing one.
- Create, edit or commit anything in the repository. It reads.
- Modify anything outside the selection.
- Translate. The repository is English and so is every description it produces.
