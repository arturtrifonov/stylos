# 0002 — Skill version supersession (naming-cleanup v0.5 → v0.7)

**Status:** Accepted
**Date:** 2026-08-20

## Problem

The master document's [§16, Known naming conflict](../master-document.md#16-known-naming-conflict) describes `stylos-naming-cleanup` v0.5 as still presenting `xs`/`s`/`m`/`l`/`xl` as valid lowercase variant-value examples, contradicting the canonical full-word size values (`extra small`…`extra large`) confirmed elsewhere. The source files available when this repository was created included v0.5, v0.6, and **v0.7** of the skill — a version newer than the one the master document cites as current.

The master document's own rule ([§1](../master-document.md#1-document-status-and-terminology)) is that superseded skill versions remain useful for history but are not normative once a newer version exists. That rule, applied literally, means v0.7 — not v0.5 — is already the current skill, and §16's "known conflict" may already be resolved.

## Investigation

Checked `stylos-naming-cleanup-v0.7-SKILL.md` directly: it explicitly lists `xs`, `s`, `m`, `l`, `xl` as **violations** to detect, with an explicit mapping table (`XS` → `extra small`, `xl` → `extra large`, etc.) and states the canonical order as the full-word values. The v0.5-era conflict does not reproduce in v0.7.

## Decision

- Import `stylos-naming-cleanup` **v0.7** as the current skill source (`skills/src/naming-cleanup/SKILL.md`), not v0.5.
- Treat master doc [§16](../master-document.md#16-known-naming-conflict) and [§27 item 7](../master-document.md#27-open-decisions) as resolved by this import, pending the master document itself being updated to reflect it (it still names v0.5 throughout as of this writing — that's a documentation lag, not a live conflict).
- v0.6 and the earlier, undated skill files found alongside v0.7 were not imported — only the highest version number was treated as current, per the project's own supersession rule.

## Consequences

- `docs/master-document.md` as currently copied into this repo is **stale on this one point** (§16, §27 item 7, and the project passport's implicit skill-version references). It should be corrected in a future edit of the master document itself, not patched around indefinitely in this decision record.
- Anyone re-deriving "what does the naming skill currently say" should read `skills/src/naming-cleanup/SKILL.md`, not §16 of the master document, until that correction lands.

## Follow-up

- Update the master document to cite v0.7 and mark §16 resolved.
- If v0.6 differs from v0.7 in ways worth preserving as history, that's a `CHANGELOG.md` note, not a reason to keep both as active sources.
