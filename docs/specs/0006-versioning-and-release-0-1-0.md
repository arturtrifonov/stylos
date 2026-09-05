# SPEC 0006 — Versioning, and the 0.1.0 release

**Status:** Open — written 2026-09-04
**Date:** 2026-09-04

A work order. Stage 4 closed on 2026-09-04: all thirty-nine core contracts are written. Nothing in the repository marks that, and the one number the plan reserved — `v0.1` — was defined as something else entirely, four months of work away. This spec fixes what a version means here, cuts `0.1.0`, and leaves the road with three tags instead of one.

No change to what any milestone contains, none to `PLAN.md` §4 or §9, and none to the registry schema beyond a definition for a field that already exists.

---

## 1. Why

**One label, two bars.** `PLAN.md` §1 defines v0.1 as *one dense screen built twice, in Figma and in code, with no local overrides* — seven requirements, four of which are false today and stay false until `@stylos/ui` exists. `PLAN.md` §9 and `ARCHITECTURE.md` §8 define the milestone `0.1` as the checklist in §4, which is thirty-nine contracts and nothing else. That checklist is now complete. Tagging today under §1's definition would make the repository assert four things that are not true, which is the one thing Stage 0 exists to prevent; not tagging at all leaves a closed milestone with no mark on it.

**One tag at the end of twenty-six weeks is not a schedule, it is a hope.** A single terminal version gives the project one forcing function and no intermediate ones. Three tags give three, and each is a real distribution decision rather than a progress percentage.

**The Figma library is about to acquire consumers, including non-human ones.** Once it is published, a change to a component is a change under somebody's instances. Which changes are allowed to break them, and how a reader — a designer, or an agent reading the library — learns which version is in front of them, are unanswered. Both have to be answered before the first publish, not after.

**A field is already carrying a version and means nothing.** Every core entry reads `version: "0.1"`. `registry/README.md` defines it as "the component's own version", which is not a definition. Either it says something checkable or it is decoration in thirty-nine files.

## 2. Scope

### In scope

- `ARCHITECTURE.md` — the decision that milestone `0.1` opens, in §8; a new §9 holding the versioning rules.
- `PLAN.md` §1, and the fifteen places that name `v0.1` as the destination.
- `README.md`, `CHANGELOG.md`, `docs/components/registry/README.md` (`version`), `figma/README.md`.
- `tools/import-tokens.mjs` and `tools/check-tokens.mjs`, for the library version marker.
- The 0.1.0 release itself: the Figma pass, the status flip, the tag, the GitHub release, the library publish.

### Out of scope

- **What any milestone contains.** `PLAN.md` §4 and §9 are not touched. `plan.mjs` parses both and neither table moves.
- **Milestone names.** `0.1`, `alpha`, `beta`, `1.0` stay. Releases fall *between* milestones, which is what `ARCHITECTURE.md` §8 already says; `0.2.0` and `0.3.0` are releases inside the `0.1` milestone, not new milestones.
- **A per-component version in the Figma description.** The repository does not write to Figma ([decision 0001](../decisions/0001-figma-connection-model.md)), so a version line in a composed description would be thirty-nine hand edits on every API change. Rejected on cost, not on merit.
- **`@stylos/ui`'s own version.** It gets one when it exists; §4 below states the relationship and nothing more.
- **A decision record.** This is a rule and a work order. `docs/decisions/README.md` sends rules to `ARCHITECTURE.md` and work to `docs/specs/`, and six records were deleted in August for ignoring that.

---

## 3. The release ladder

**Replaces `PLAN.md` §1 in full.** The seven requirements are not dropped — they are distributed across the three tags, plus three that only exist once the library is published.

| Tag | The decision it makes | Gate | Stage |
| --- | --- | --- | --- |
| `0.1.0` | the contracts for the core set are fixed, and the Figma library implementing them is published | §3.1 | S4 · done, plus this spec |
| `0.2.0` | the system renders — tokens are consumable as CSS and `@stylos/ui` builds the core set | §3.2 | S5 |
| `0.3.0` | the system is proved — one dense screen exists twice, from Stylos alone | §3.3 | S6 |

`0.3.0` is the old `v0.1` gate, unchanged in substance. The number moved; the bar did not.

### 3.1 `0.1.0`

1. No foundation document leaves open a question a **component contract** depends on.
2. Every core-set entry carries a Figma node identifier, and the registry is readable — the registry view.
3. The core set meets [`STANDARD.md`](../components/STANDARD.md), both gates: *Complete enough to publish* and *Ready to publish*.
4. Every core entry reads `status: published`. An entry that does not is not in the release and is named as excluded in the notes.
5. The Figma library is published, and `Meta / version` in it reads the tag.
6. `npm test`, `npm run validate:registry` and `npm run validate:skills` exit 0.

### 3.2 `0.2.0`

1. No foundation document leaves open a question the **CSS build** depends on.
2. Tokens generate to CSS custom properties from the canonical set — the build command.
3. `@stylos/ui` builds and renders every documented variant of the core set — package build.
4. Component props map 1:1 onto Figma variant properties — a mapping table per component.

### 3.3 `0.3.0`

1. One dense, real product screen exists twice — in Figma and in code — built entirely from Stylos, with no local overrides in either.
2. The proof screen contains no hardcoded colour, size or spacing — a lint rule in the package.

**Not required for any of the three:** a native icon set, mobile support, client-brand themes beyond the contract, a public documentation site, a license, or coverage of all 103 registry entries.

---

## 4. What is versioned

**Destined for `ARCHITECTURE.md` §9, verbatim.**

**One version line covers the system**: the contracts in `docs/components/registry/`, the canonical tokens in `tokens/`, and the Figma library that implements them. They cannot drift by design — the registry entry *is* the library's contract and holds its `figma.node_id` — so versioning them apart would track a difference that must not exist. That number lives in `package.json` and is what a git tag names.

**`@stylos/ui` carries its own semver** when it exists, published to npm on its own schedule, and declares in one line which system version it implements. This is the only place two numbers meet, and the relationship is one-way.

**A release is a tag**, chosen at the moment it is cut. How many releases fall between two milestones, and which number a milestone ships under, stays undecided until it happens — §8 already says this and this section does not narrow it.

**Semver, read against the contract, not against the code.** A change is:

| | |
| --- | --- |
| **Major** | a component is removed, or a documented property, value or state disappears |
| **Minor** | a component is added, or a property, value or state is added without changing what exists |
| **Patch** | appearance, tokens, prose, findings, and any fix that leaves the API where it was |

Pre-1.0 this is a description, not a promise: `ARCHITECTURE.md` §9 must say in as many words that below `1.0` a major change may ship in a minor release, and that the *only* commitment is that the notes name it. A stability claim the project cannot honour solo is worse than none.

---

## 5. Compatibility in Figma

Figma has no semver, and no way for a consumer to pin or install an earlier version of a library — an update is to the latest publish or nothing. So compatibility here is not version negotiation. It is one question: **does this change break existing instances?**

**Breaks instances:**

- deleting a component or a component set;
- deleting a variant that instances are using;
- deleting a property, or changing its type;
- moving a component to a different file — a new key, and every instance loses its link.

**Does not break instances:**

- renaming the component (the key is stable);
- adding a property with a default, adding values, adding variants;
- any change to appearance, tokens, layer structure or description.

**One item to verify before relying on it:** renaming a variant property or one of its values. Figma carries property identity by id rather than by name, so the rename should propagate to instances — but the failure mode is silent, and this system is about to do a batch of renames. Test it in the Playground on a throwaway set before the 0.1.0 pass, and record the result here.

This list is what the major/minor/patch table in §4 means when the change is in Figma rather than in a file.

---

## 6. The version marker in the library

The publish description is where a person meets the version, and it is written once at publish, which has to happen anyway. Nothing else is asked of a human, and there is no cover frame: a hand-maintained frame is a second copy of a fact, and it rots exactly like every other second copy this project has removed.

**An agent reads variables.** So:

1. **`Stylos / Styles` gains a `Meta` collection with one `STRING` variable, `version`,** set to the release it belongs to. One field, edited once per release, readable through the plugin API, the REST API and `get_variable_defs`.
2. **`npm run tokens:import` records it** — not into `tokens/`, because a version is not a token, but into a generated `figma/library.yaml`:

   ```yaml
   # Generated by npm run tokens:import. Never hand-edited.
   version: "0.1.0"
   imported_at: "2026-09-05"
   ```

3. **`npm run tokens:check` fails when `figma/library.yaml`'s version does not match `package.json`.** Forgetting to bump the variable stops being invisible.

**State the limit honestly in `figma/README.md`:** the export is manual and per-collection, so this answers *what version the library reported at the last export*, never *what it is right now*. It catches a forgotten bump at release time, which is when it matters, and claims nothing else. `figma/README.md`'s "what does not belong here" currently forbids anything hand-edited claiming current Figma state; `library.yaml` is generated, and the section needs one clause saying so.

---

## 7. `version` on a registry entry

Currently defined as "the component's own version" and set to `"0.1"` on all thirty-nine. Give it a definition or delete it.

**Definition:** the release in which this contract's current API shipped. Bumped when the entry's `api` changes — a property, a value, a default, a state — never for prose, findings, `last_verified`, or appearance.

Consequences:

- **Format is the full release string.** `"0.1.0"`, not `"0.1"`, so it reads against the tag without interpretation and sorts. Thirty-nine mechanical edits, done with a script, not by hand.
- **The validator gains one check:** `version` must be a release that exists — not ahead of `package.json`.
- A contract that has never shipped carries the release it is expected to ship in; `status` already says whether it has.

This is the field that makes a diff between two library versions answerable without reading thirty-nine files, which is the whole reason to keep it.

---

## 8. Release notes: one source, two surfaces

**`CHANGELOG.md` is the source.** Each version's section gains a `### Figma library` subsection recording the publish date and what moved in the library — the components published, the renames, anything from §5's breaking list. Nothing else holds a second copy.

**The Figma publish description is one line** pointing at the release:

```
Stylos 0.1.0 — 39 core components, contracts fixed. Notes: <release URL>
```

**GitHub Releases: yes.** Annotated tag, release body copied from the `CHANGELOG.md` section.

**GitHub Milestones: no.** They attach to issues and pull requests, which this project does not use, and the milestone list is already normative in `PLAN.md` §9 and parsed by `plan.mjs` on every build. A second copy is what `ARCHITECTURE.md` §8 exists to prevent.

**A script later, not now:** `npm run release:notes -- 0.1.0` printing the publish line and the release body from `CHANGELOG.md`. Worth it on the third release, not the first.

---

## 9. The 0.1.0 checklist, in order

### A — The repository tells the truth

1. Merge `wave-6-shell` into `master`.
2. `button-icon.yaml` — sweep every reference to `Button Icon`, then delete the file. It is a bare inventory record with no contract sitting beside the three members it split into on 2026-09-03; the fourth surface of a split stopped short again.
3. `npm test`, `npm run validate:registry`, `npm run validate:skills` — all green before anything else starts.

*(The `README.md` repository URL, which named `wrgraff/stylos` against a remote of `arturtrifonov/stylos`, was corrected on 2026-09-04 and is out of this list.)*

### B — The library earns the claim

5. Run `stylos-component-integrity-check` and `stylos-naming-cleanup` over the thirty-nine. Fix findings **in Figma before recording them**, or the defect becomes the contract.
6. Confirm every core `id` matches its Figma component name. Twenty-one ids became compound names on 2026-09-02 and the renames were scheduled inside the wave that wrote each contract; all thirty-nine now have contracts, so all core renames are due. The list is in each entry's header comment. A rename does not break instances (§5) and is free before the first publish.
7. `documentationLinks` — `Button Inner` points at a node in *Default Kit: Components* rather than at the repository. Check the set, fix the targets.
8. Add the `Meta` collection and `version` variable (§6). Export, import, confirm `figma/library.yaml`.
9. Re-verify `figma.last_verified` on every entry touched by 5–7.

### C — Fix the milestone

10. Flip `status: draft → published` on every entry that passed B. Anything that did not stays `draft` and is named in the notes as excluded — the release is allowed to be smaller than thirty-nine, it is not allowed to be vague about which.
11. Normalise `version` to `"0.1.0"` across the set, and add its definition to `registry/README.md` (§7).

### D — Documents

12. `ARCHITECTURE.md` — §8 gains the decision that `0.1` opens; §9 is new (§4 and §5 of this spec).
13. `PLAN.md` — §1 replaced by §3 of this spec; §3, §5, §7 and the fifteen `v0.1` mentions swept to the tag each one means.
14. `README.md` — the status line and the `PLAN.md` description.
15. `CHANGELOG.md` — delete "versioning is not yet defined — there is nothing released to version"; roll `[Unreleased]` into `## [0.1.0] — <date>`, keeping its dated subheadings; add `### Figma library`.

### E — Cut it

16. Annotated tag `v0.1.0` on `master`.
17. GitHub release from the tag, body from `CHANGELOG.md`.
18. Publish the Figma library, description per §8 — **after** the tag, so the link resolves.

---

## 10. Estimate

| Block | Estimate |
| --- | ---: |
| A — repository truth | half a day |
| B — the Figma pass over 39 | 1–3 wk |
| C, D, E | ~1 wk |

**B is the whole variance.** Priced at three weeks if the integrity check surfaces findings across a third of the set; at one if the last run was clean and nothing has moved since. Nothing else here is uncertain.

**Scope lever, if B runs long:** ship 0.1.0 with the subset that passed and name the rest as contracted-but-unpublished (step 10 already allows it). Do not ship by relaxing *Ready to publish* — that is the only gate the release has.

Against the plan's remaining road: `0.1.0` in 2–4 weeks, `0.2.0` at S5 (11–13 wk), `0.3.0` at S6 (4 wk). Roughly 17–20 weeks to the screen that used to be called v0.1, which is the same number it always was.

---

## 11. Acceptance criteria

- `PLAN.md` names three tags with three gates, and no document defines `v0.1` as a destination.
- `ARCHITECTURE.md` §9 answers, without reference to any other document: what carries a version, what major/minor/patch mean here, what breaks a Figma instance, and what is not promised before 1.0.
- `git tag` lists `v0.1.0`; the GitHub release body and the `CHANGELOG.md` section are the same text.
- The published Figma library's `Meta / version` reads `0.1.0`, and `npm run tokens:check` passes against it.
- Every entry the release claims reads `status: published` and `version: "0.1.0"`; every entry it does not claim is named in the notes.
- `npm test`, `npm run validate:registry`, `npm run validate:skills` exit 0 at the tagged commit.

## 12. Left open, deliberately

- **The variant-property rename behaviour** (§5), until it is tested in the Playground. Everything else in that section is settled.
- **A license.** `0.1.0` publishes a Figma library from a repository marked `UNLICENSED`. That is coherent while the library is private and stops being coherent the moment anyone else is given the link — an `alpha` question, named here so it is not discovered there.
- **What `alpha` requires beyond its checklist.** §9 lists its entries; whether internal distribution also needs a changelog discipline, a support expectation or a migration note is not decided and does not block this release.
