# 0001 — Figma connection model

**Status:** Accepted (for the Alpha stage; revisit in Phase 4/5)
**Date:** 2026-08-20

## Problem

Figma is the live source of truth for Stylos variables, styles, and components (master doc [§8.1](../master-document.md#81-figma)), but a Figma file cannot be stored in a git repository, diffed, reviewed, or built against directly. The repository still needs to (a) describe the Figma library well enough to work with it systematically, (b) keep a history of what it contained, and (c) eventually let documentation and a future Svelte package reference it without manual re-derivation every time. We need a concrete model for how the repo and Figma stay related, not just an aspiration that they should be.

## Constraints already set by the master document

- No bidirectional sync before a reliable round trip exists — this is an explicit non-goal (master doc [§4.3](../master-document.md#43-explicit-non-goals-for-the-current-stage)).
- Figma Agent is the preferred execution environment for variable/component-heavy operations; MCP-based workflows were already tried and found unreliable for some of these tasks (master doc [§8.5](../master-document.md#85-figma-agent-and-external-automation)).
- Tokens Studio may be used as an optional inspection utility only; Stylos must not depend on its paid plan (master doc [§8.4](../master-document.md#84-tokens-studio)).
- Native Figma exports are immutable, dated, versioned snapshots — never a second editable source (master doc [§8.3](../master-document.md#83-exports)).

## Options considered

1. **Do nothing until the Figma API/plugin story is figured out.** Rejected — blocks the current milestone, which is explicitly documentation + a reproducible template, not automation (master doc [§25](../master-document.md#25-current-milestone)).
2. **Tokens Studio as the bridge**, using its GitHub sync feature to push/pull variables automatically. Rejected for Alpha — that sync quality depends on the paid plan, which is an explicit constraint to avoid, and it would quietly make Tokens Studio a second source of truth rather than an inspection utility.
3. **Figma REST API with a personal access token**, scripted to pull variables and component images on a schedule or on demand. Deferred, not rejected — this is real and buildable (see below), but it's Phase 4 automation, not a Phase 1 documentation-milestone requirement. Building it now risks exactly the "premature frontend/automation structure" risk called out in master doc [§28.6](../master-document.md#286-premature-frontend-structure).
4. **Manual, versioned, one-directional export discipline** (adopted): a human exports Figma Variables natively when the library changes meaningfully, drops the file in `figma/variables/exports/` with a date, and the repo's Markdown documentation describes the library's structure and rules in prose. No automation required to start.

## Decision

Adopt option 4 now; keep option 3 as the documented next step, not a current requirement.

Concretely:

- **`figma/README.md`** documents the Figma workspace structure — currently three linked library files (Components, Styles, GUI Helpers) — and the rule that Figma remains authoritative for anything live: variables, styles, component structure, variants, and Figma-native documentation (StateDiagrams, PropTables, anatomy diagrams).
- **`figma/variables/exports/`** holds dated, immutable native Variables JSON snapshots. Nothing in this repo edits them; a new export is a new dated file, not an overwrite (master doc [§8.3](../master-document.md#83-exports)).
- **`skills/`** is the one place where the repo *does* actively drive Figma work — modular skill sources compiled into a single Markdown document, imported manually into Figma Agent. This is already a form of "repo → Figma" connection, just instruction-shaped rather than data-shaped.
- **Component documentation** (`docs/components/`) describes public API and rules in text; it deliberately does not try to mirror every PropTable or StateDiagram that already lives correctly in Figma.

## Screenshots for documentation

The document also asked about pulling component screenshots (default state, variant states) for the future documentation surface. Two workable paths, neither needed for this milestone:

- **Figma REST API `images` endpoint** — given a personal access token, a file key, and node IDs, it renders PNG/SVG images of specific nodes/frames on demand. This is the most direct way to script "one screenshot per variant" for documentation later; it needs no plugin, just a token and a small script (candidate for `tools/` once it's built).
- **Manual export** — for the small number of components that exist today, exporting screenshots by hand from Figma is entirely reasonable and requires no tooling investment. Not worth automating before there's a real inventory of components to screenshot ([§27 item 10](../master-document.md#27-open-decisions)).

Recommendation: don't build the screenshot pipeline until Phase 3 (component inventory) exists — there's nothing to screenshot systematically yet, and a script built against zero real components will guess at requirements it can't yet know.

## Consequences

- The repo cannot currently detect *automatically* when Figma has drifted from a stored snapshot — that's a manual "re-export and diff" step for now. Acceptable during Alpha; revisit in Phase 4 (master doc roadmap).
- Anyone reading this repo without Figma access can still understand the system's structure and rules, just not see live examples. Figma-native documentation (StateDiagrams etc.) is not duplicated here, so full component detail still requires Figma access until Phase 3/5 documentation work lands.
- This keeps a single source of truth per artifact type: Figma for live design state, this repo for everything else. No artifact is edited in two places.

## Follow-up

- Build a small `tools/` script against the Figma REST API for variable export and/or component image export, once there's a real component inventory to point it at (Phase 3–4).
- Revisit this record when Svelte/Storybook work begins (Phase 5) — code-side token consumption will need a defined pipeline from `figma/variables/exports/` (or a live API pull) into a token format Svelte can consume; that's a separate decision, not assumed here.
