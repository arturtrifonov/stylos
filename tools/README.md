# tools/

Only scripts required to build or validate project artifacts. Kept small and dependency-free during Alpha (master doc [§20.5](../docs/master-document.md#205-tools)) — add a dependency only when a script genuinely can't do its job without one.

## `build-skills.mjs`

Compiles `skills/src/*/SKILL.md` into `skills/dist/stylos-figma-agent.md`, in the order declared by `skills/targets/figma-agent.md`. No dependencies — plain Node, run via:

```bash
npm run build:skills       # write skills/dist/stylos-figma-agent.md
npm run validate:skills    # fail if dist/ is missing or stale relative to src/
```

Fails loudly (not silently) if: the include order references a skill directory that doesn't exist, or a skill's `SKILL.md` is missing YAML frontmatter or a `name`/`version`.

## Future candidates

Not built yet — see [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md):

- A Figma REST API script to pull variable snapshots and/or component screenshots automatically, once there's a real component inventory to point it at.
- Link/heading/duplicate-rule validation across skill sources (master doc [§19](../docs/master-document.md#19-skill-source-and-distribution-architecture) mentions this as a build-model goal; not implemented — `build-skills.mjs` currently only validates structural completeness, not cross-skill rule conflicts).
