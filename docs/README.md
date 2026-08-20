# docs/

Authored design-system knowledge. This is a source in its own right, not a generated export — everything here is written and maintained by hand.

## Contents

- [`master-document.md`](master-document.md) — the master project document. Project-wide intent, contracts, principles, naming rules, skill system, roadmap, governance, and open decisions. Start here.
- [`foundations/`](foundations/README.md) — one document per foundation (color, typography, spacing, sizing, icons, effects). Detail that would make the master document unmaintainable if inlined.
- [`components/`](components/README.md) — one document per public component, following the standard in master doc [§17](master-document.md#17-component-documentation-standard).
- [`decisions/`](decisions/README.md) — decision records for architectural choices, so the reasoning behind a decision survives longer than the decision itself.
- [`research/`](research/README.md) — open investigations that haven't produced a decision yet (e.g. spacing-token naming, per master doc [§12.1](master-document.md#121-direction)).

## Editorial rules

- The master document defines what's true project-wide. A foundation or component document may add detail; it must not contradict the master document. If it needs to, that's a decision record, and the master document gets updated.
- Every open item should trace back to [§27 Open decisions](master-document.md#27-open-decisions) in the master document, or be added there.
- Don't duplicate a normative rule in two places. If a rule lives in a skill (`skills/src/`), the skill is the source for its own operation (master doc [§1](master-document.md#1-document-status-and-terminology)) — link to it rather than restating it.
