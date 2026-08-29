# SPEC 0004 — Registry reconciliation

**Status:** Built — 2026-08-29
**Date:** 2026-08-29

A work order. `npm run validate:registry` exits 1 today. This clears every failure, repairs what the three family splits left behind, gives the Button family the structure Figma already has, and removes the copied counts and the Airtable facet that let the registry be read as a plan.

No contract is written here. Contracts are [`PLAN.md`](../../PLAN.md) Stage 4, wave by wave; this makes the file they extend consistent first.

---

## 1. Why

Three things are true of the registry as it stands.

**It contradicts itself.** The validator reports 17 FAIL and 214 REPORT. Fifteen of the failures are references to `Radio`, an entry that was deleted when the component was split into three; two are `do_not_use_when` naming `Toggle Label`, which never existed. Ninety-six of the reports are one-sided relations, and all ninety-six are debris from the Checkbox and Radio splits.

**It disagrees with Figma about the Button family.** Figma holds three sets under `Button / Button Basic | Outline | Ghost`, each 100 variants with an identical API. The registry has one entry, named without the slash path, and no entry at all for the other two. Wave 5 cannot start against that, and `do_not_use_when.instead` cannot become a list while two of the three anchors do not exist.

**It can still be read as a plan.** `PLAN.md` §4 now states that the Airtable `import.batch` numbers are history and not the queue. The registry viewer still offers Batch as a filter facet, a sortable column and a table column — which is what an index offers for the thing you are meant to plan by, and it contradicts spec [0002](0002-registry-viewer.md), which put those values in the detail panel under a dated heading for exactly this reason.

## 2. Scope

### In scope

- The 17 FAIL conditions.
- The 96 one-sided relations, by applying the split rule in §3.1.
- Registry structure for the Button family: two new entries, one id and path move, references rewritten.
- Removing the Batch facet, sort and column from the registry viewer.
- Removing copied counts from the documents that are still live.

### Out of scope

- **Writing any contract.** No `summary`, `purpose`, `api`, `sizing_model` or `figma` block is authored here, for any component, including the two entries this spec creates. They are created as inventory entries with the fields the schema requires and nothing more.
- **Anything in Figma.** `tone = error` across the three Button sets violates [`naming.md`](../foundations/naming.md) §4 and is real, but it is a library change and belongs to wave 5 with the contracts.
- **The 109 "composed from at or above its own level" reports.** They are a question about the level model, not damage; they were reported on the validator's first run and nothing has changed.
- **The `children`/`parents` redundancy.** Whether the allowed axis should be stored on one side, the way `uses` now is, touches every entry and is its own decision.
- **Backfilling `status` and `version`** onto the entries with no contract. Absence is the current design and nothing reads it.
- **Specs [0002](0002-registry-viewer.md) and [0003](0003-component-page.md).** They are finished tickets and their counts are true of the day they were written. Do not sweep them.

## 3. The work, in order

### 3.1 The split debris

The rule is in [`registry/README.md`](../components/registry/README.md), *When a component is split*, and it governs every future split as well as this repair. Apply it here; do not restate it.

**Radio.** Fifteen entries reference `Radio`. Replace that string with `Radio Input`, `Radio Label` and `Radio Text` in each — eleven that name it as a child (`Accordion / Container`, `Alert`, `Asset`, `Bottom Sheet`, `Flex Layout`, `Header`, `Hero`, `Modal`, `Side Panel`, `Side Panel Menu`, `Toast`) and four that name it as a parent (`Badge`, `Icon`, `Label`, `Loader`). The three member files already carry the old entry's four children and eleven parents, so this one operation clears 15 FAIL and 45 REPORT and leaves both sides reciprocal.

**Checkbox.** The mirror image: thirteen entries name the members as children and four name them as parents, while `checkbox-input.yaml`, `checkbox-label.yaml` and `checkbox-text.yaml` carry no relations at all. Recover the old `checkbox.yaml` from git and give all three members its `children` and `parents`, then reconcile against the entries that already name them. Clears 51 REPORT and the three "has no parents and no children" reports.

**Indicator** is the precedent that already works — both members carry 48 parents and the validator reports nothing about them. Do not touch it.

### 3.2 The two remaining failures

`checkbox-input.yaml` and `checkbox-label.yaml` name `Toggle Label` as the alternative in `do_not_use_when`. No such entry exists: Toggle has not been split, and today the only anchor is `Toggle`. Point both at it.

**The anchor is provisional.** `Toggle` was noted earlier as having the same id-versus-Figma mismatch that `Checkbox` and `Radio` had, which would make it three components rather than one — and `Toggle Label` reads as written in anticipation of a member that does not exist yet. That has not been verified against the file; verify it when Toggle is opened. Toggle is wave 2. When it splits, *When a component is split* step 4 rewrites these two references along with every other, and that is the point of doing it by rule rather than by hand.

### 3.3 The Button family

Structure only — no contract fields.

1. **Create `docs/components/registry/button/button-outline.yaml` and `button-ghost.yaml`**, ids `Button / Button Outline` and `Button / Button Ghost`. Copy `level`, `role`, `flow_behavior`, `children` and `parents` from `Button Basic`; they are the same component in three treatments and the composition does not differ.
2. **Move `button-basic.yaml` to `button/button-basic.yaml`** and change its id to `Button / Button Basic`. The registry requires the id to match the Figma name and the path to follow from the id, the way `Table / TD Text` does; `registryPathFor` enforces it.
3. **Rewrite the references.** Seventeen entries name `Button Basic` as a child or a parent, and two name it in `do_not_use_when.instead` (`Button Inner`, `Link`). All become `Button / Button Basic`. The new entries add their own reciprocal edges to the same seventeen.
4. **Set `family: "Button"` on all three.** Leave `Button Icon`, `Button Group`, `Button Dropdown` and `Button Inner` untouched: they are separate Figma pages, not members of the slash group, and `Button Inner`'s one-member family is a decision rather than an oversight — the validator's report about it is expected and stays.
5. **`do_not_use_when.instead` takes a list.** With all three anchors present, extend the schema to accept either a string or a list of ids, update `registry/README.md` and the validator, and change the two entries that were left pointing at `Button Basic` alone to name the family.

Only `Button Basic` diverges in name. `Button Icon`, `Button Group` and `Button Inner` sit on their own Figma pages and their ids are already right.

### 3.4 The viewer

Remove the Batch facet from the filter bar, the `batch` sort key and the Batch table column from `tools/build-registry-view.mjs`. The values stay in the detail panel under the dated heading naming their origin, which is what [0002](0002-registry-viewer.md) specified. Update `registry/README.md`, which still advertises filtering by Airtable batch.

### 3.5 The count sweep

A count copied into prose is a fact stored twice, and every one of these is now wrong. Remove them rather than updating them, unless the number is doing work the sentence cannot do without.

`docs/components/README.md` was cleared on 2026-08-29. What remains:

| File | What it says |
| --- | --- |
| `docs/components/STANDARD.md` | "recorded for all 96 components"; "Three contracts exist — the Checkbox family… 96 entries… the v0.1 core set of 23 components" |
| `docs/components/registry/README.md` | "in 96 entries it was never once filled" (load-bearing — it is the evidence for removing `used_by`; keep, and date it); "the 96 legacy entries" |
| `tools/lint-registry.mjs` | "93 of the 96 entries carry none of the contract fields" (comments, twice) |
| `tools/build-registry-view.mjs` | "a 96-row diff into every registry change" |

How many entries carry a contract is derived — `documented` in the registry view. Point at it; do not restate it.

## 4. Not decided here

**`Button Dropdown` has an entry and no component was found in Figma** on 2026-08-29. Either it lives somewhere the search did not reach or the entry is stale. Leave the entry alone until that is answered; deleting an entry that seventeen others reference on the strength of one search is how the `Radio` failures happened.

## 5. Acceptance

1. `npm run validate:registry` exits 0.
2. No entry references an id that does not resolve, in `children`, `parents`, `uses` or `instead`.
3. The 96 one-sided relation reports are gone, and "has no parents and no children" is reported for three entries (`Date Picker`, `Dropdown`, `Popover`), not six.
4. `Button / Button Basic`, `Button / Button Outline` and `Button / Button Ghost` exist at `registry/button/`, each carrying `family: "Button"`, and no reference to `Button Basic` remains.
5. `do_not_use_when.instead` accepts a list, the validator resolves every member of it, and `registry/README.md` documents it.
6. `npm run registry:view` renders no Batch filter, sort or column, and the values still appear in the detail panel under their dated heading.
7. Searching the repository for `96` or `93` as a count of entries returns nothing outside `docs/specs/0002` and `0003`.
