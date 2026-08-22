# 0005 — Master document decomposition

**Status:** Accepted
**Date:** 2026-08-22

## Problem

`docs/master-document.md` has two contradictory statuses in the repository.

[`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6 lists it as **archived** at `docs/archive/master-document.md` — "a bootstrap dump… It contains early ideas, superseded values, and aspirational passages presented as fact. It has **no normative force** and is not maintained. Nothing should cite it."

Meanwhile the file sits at `docs/master-document.md`, [`README.md`](../../README.md) calls it "the full, authoritative description of the project," [`docs/README.md`](../README.md) says "Start here," and all four existing decision records cite it by section as their source of authority.

Both cannot be true. And the second problem is worse than the inconsistency: ARCHITECTURE.md is right that the document contains superseded values, but those 57 KB are also the **only** written record of several rules the system actively depends on — the naming contract (§15), the component documentation standard (§17), the token layer model (§9), the quality bar (§22). Archiving the file as it stands would delete the system's only copy of its own rules.

## Decision

**Decompose the master document into the normative structure, then archive what remains.**

Each section moves to the home that owns its domain. Nothing is deleted without a destination. Once every section has moved and every cross-reference has been repointed, the file moves to `docs/archive/master-document.md` and ARCHITECTURE.md §6 becomes true as written.

### Destination map

| Master doc | Destination | Note |
| --- | --- | --- |
| §1 terminology | `ARCHITECTURE.md` §7 | maturity labels are a convention |
| §2 project passport | `docs/passport.md` | new |
| §3 purpose, §4 scope, §5 character, §6 principles, §29 success criteria | `docs/charter.md` | new — why the system is the way it is |
| §7 architecture, §8 sources of truth, §20 repository structure | `ARCHITECTURE.md` §1–§2, §6 | already there; verify and absorb differences |
| §9 token architecture | `docs/foundations/tokens.md` | new |
| §10 color | `docs/foundations/color.md` | exists |
| §11 typography | `docs/foundations/typography.md` | exists |
| §12 spacing and sizing | `docs/foundations/spacing.md`, `sizing.md` | exist |
| §13 icons, borders, radii, effects | `docs/foundations/icons.md`, `effects.md` | exist |
| §14 component architecture | `docs/components/README.md`, registry README | levels settled by [0003](0003-component-levels-and-size-grid-scope.md) |
| §15 naming and public API rules | `docs/foundations/naming.md` | new — most-cited section |
| §16 known naming conflict | **dropped** | resolved by [0002](0002-skill-version-supersession.md); recorded in `CHANGELOG.md` |
| §17 component documentation standard | `docs/components/STANDARD.md` | new — second most-cited |
| §18–§19 skill system | `skills/README.md` | exists; skill behaviour stays sourced from `skills/src/` |
| §21 documentation architecture | `docs/README.md` | provisional until ADR 0015 settles the boundary |
| §22 quality model | `docs/quality.md` | new |
| §23 governance | `ARCHITECTURE.md` §7, `docs/decisions/README.md` | already there |
| §24 versioning and releases | `docs/versioning.md` | new |
| §25 milestone, §26 roadmap | `PLAN.md` | superseded |
| §27 open decisions | `PLAN.md` §6 | see below |
| §28 known risks | `ARCHITECTURE.md` §5, `PLAN.md` §7 | system breaks vs. execution risks |

### Open decisions do not get a normative list

ARCHITECTURE.md §6 already refuses one: "a separate list drifts from reality." That stands. §27's content lives in [`PLAN.md`](../../PLAN.md) §6, where it is mapped to the stage that resolves each item — a working document expected to be revised, not a normative register.

### Corrections applied during the move

Extraction is not transcription. Where a section is provably stale, the destination document carries the corrected version and the correction is recorded here:

- §15's opening line cites `stylos-naming-cleanup` **v0.5** as the naming contract. Corrected to **v0.7** per [0002](0002-skill-version-supersession.md).
- §15 and §16's abbreviated size values (`xs`/`s`/`m`/`l`/`xl`) are dropped; full words are canonical.
- §14.1's "typography profiles are not yet defined" for levels beyond Element and Object is corrected per [0003](0003-component-levels-and-size-grid-scope.md).
- §5.2 and §12.1's Fibonacci framing is corrected per [0006](0006-proportional-logic.md).
- §2's repository link, previously "To be added," is `https://github.com/wrgraff/stylos`.

Anything else that turns out to be wrong gets its own record rather than a silent fix during the move.

## Alternatives considered

**Re-promote the master document.** Cheapest — one edit to ARCHITECTURE.md §6. Rejected because it makes a 57 KB document containing acknowledged superseded values the project's source of truth, and because a single document that is simultaneously the charter, the foundations, the naming contract, and the roadmap cannot be maintained section by section. The four decision records already written all had to correct it.

**Relabel it as a historical reference in place**, extracting only §15 and §17 now. Rejected as an interim that would have to be finished anyway, while leaving the repository in the same two-status state it is in today for an indefinite period.

## Consequences

- The normative set grows from four places to seven: `ARCHITECTURE.md`, `docs/foundations/`, `docs/decisions/`, `docs/components/registry/`, plus `docs/charter.md`, `docs/components/STANDARD.md`, and `docs/quality.md`. ARCHITECTURE.md §6 must be rewritten to list them.
- Decision records 0001–0004 cite master-document sections by anchor. Those links must be repointed as part of the move, not left to rot.
- Until the move completes, `docs/master-document.md` **stays in place**. Removing it mid-way would break every reference in the repository at once.
- This work is Stage 0 of [`PLAN.md`](../../PLAN.md) and enlarges it by roughly two to three weeks. The plan's estimate is updated accordingly.

## Follow-up

- Execute the move in passes, most-cited sections first, updating references only after every destination exists.
- On completion: move the file to `docs/archive/`, add an archive header stating it has no normative force, rewrite ARCHITECTURE.md §6, and update `README.md` and `docs/README.md` to stop calling it authoritative.
