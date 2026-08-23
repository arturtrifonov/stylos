# SPEC 0002 — Master document decomposition

**Status:** In progress
**Date:** 2026-08-23

A work order. `docs/master-document.md` is broken up into the places that own each subject, then archived.

---

## 1. Why

The file has two contradictory statuses. [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6 lists it as archived at `docs/archive/master-document.md`, with "no normative force" and "nothing should cite it". It is in fact at `docs/master-document.md`, [`README.md`](../../README.md) calls it "the full, authoritative description of the project", and [`docs/README.md`](../README.md) says "Start here".

The second problem is worse than the inconsistency. ARCHITECTURE.md is right that the document contains superseded values — but those 57 KB are also the only written copy of several rules the system depends on. Archiving it as-is would delete the system's record of its own rules.

So: move each section to the place that owns it, then archive what remains.

## 2. Destinations

| Master doc | Destination | Status |
| --- | --- | --- |
| §1 terminology | `ARCHITECTURE.md` §7 | |
| §2 project passport | `docs/passport.md` — new | |
| §3 purpose, §4 scope, §5 character, §6 principles, §29 success criteria | `docs/charter.md` — new | |
| §7 architecture, §8 sources of truth, §20 repository structure | `ARCHITECTURE.md` — verify and absorb differences | |
| §9 token architecture | `docs/foundations/tokens.md` — new | |
| §10 color | `docs/foundations/color.md` | **done** |
| §11 typography | `docs/foundations/typography.md` | **done** |
| §12 spacing and sizing | `docs/foundations/spacing.md`, `sizing.md` | **done** |
| §13 icons, borders, radii, effects | `docs/foundations/icons.md`, `effects.md` | **done** |
| §14 component architecture | `docs/components/README.md`, registry README | partly |
| §15 naming and public API rules | `docs/foundations/naming.md` | **done** |
| §16 known naming conflict | **dropped** — resolved; noted in `skills/README.md` | **done** |
| §17 component documentation standard | `docs/components/STANDARD.md` | **done** |
| §18–§19 skill system | `skills/README.md` | partly |
| §21 documentation architecture | `docs/README.md` | |
| §22 quality model | `docs/quality.md` — new | |
| §23 governance | `ARCHITECTURE.md` §7 | |
| §24 versioning and releases | `docs/versioning.md` — new | |
| §25 milestone, §26 roadmap | `PLAN.md` | **done** — superseded |
| §27 open decisions | `PLAN.md` | **done** — see §4 below |
| §28 known risks | `ARCHITECTURE.md` §5 (system breaks), `PLAN.md` (execution risks) | partly |

## 3. Rules for the move

- **Extraction is not transcription.** Where a section is provably stale, the destination carries the corrected version and the correction is noted in `CHANGELOG.md`.
- **The file stays in place until the move completes.** Removing it mid-way breaks every reference in the repository at once.
- **References are repointed last**, once every destination exists.
- A section with no destination worth having is dropped, and the drop is recorded — not left in limbo.

## 4. Open decisions do not get a list

`ARCHITECTURE.md` §6 refuses one: "a separate list drifts from reality." That stands. §27's items live in `PLAN.md`, attached to the stage that resolves each — a working document expected to be revised, not a register.

## 5. Corrections already applied during extraction

- §15 cited `stylos-naming-cleanup` v0.5 as the naming contract. It is **v0.7**.
- §15 and §16's abbreviated size values (`xs`/`s`/`m`/`l`/`xl`) are dropped; full words are canonical.
- §14.1's "typography profiles are not yet defined" beyond Element and Object is corrected: Widget and Layout will never have a shared grid.
- §5.2 and §12.1's Fibonacci framing is withdrawn — the implemented scale is base-8. See [`spacing.md`](../foundations/spacing.md).
- §2's repository link, previously "To be added", is `https://github.com/wrgraff/stylos`.

## 6. Done when

`docs/master-document.md` is at `docs/archive/master-document.md` with a header stating it has no normative force; nothing in the repository cites it; `ARCHITECTURE.md` §6 is true as written; `README.md` and `docs/README.md` no longer call it authoritative.
