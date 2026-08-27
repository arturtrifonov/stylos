# Target: figma-agent

Configuration for the one current build target — a single Markdown document for manual import into Figma Agent.

Output: `../dist/stylos-figma-agent.md`

## Include order

Deterministic. `tools/build-skills.mjs` reads this list top to bottom and concatenates each skill's `SKILL.md` in this order. Read-only skills first, then skills that write changes, ending with the composition-heavy skill — so a human scanning the compiled document meets audits and conventions before behaviors that create or rename things.

- component-integrity-check
- description-sync
- naming-cleanup
- reference-reconstruction

`description-sync` sits with the writing skills but before `naming-cleanup`: it writes a description and nothing else, while renaming changes the very names it derives a registry path from. Reading it first is the order the work actually happens in.

To add a skill to this target: add its source directory under `../src/`, then add its folder name to the list above.
