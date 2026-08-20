# tools/

Only scripts required to build or validate project artifacts. Kept small and dependency-free during Alpha (master doc [§20.5](../docs/master-document.md#205-tools)) — add a dependency only when a script genuinely can't do its job without one.

## `build-skills.mjs`

Compiles `skills/src/*/SKILL.md` into `skills/dist/stylos-figma-agent.md`, in the order declared by `skills/targets/figma-agent.md`. No dependencies — plain Node, run via:

```bash
npm run build:skills       # write skills/dist/stylos-figma-agent.md
npm run validate:skills    # fail if dist/ is missing or stale relative to src/
```

Fails loudly (not silently) if: the include order references a skill directory that doesn't exist, or a skill's `SKILL.md` is missing YAML frontmatter or a `name`/`version`.

## `import-component-registry.mjs` and `lint-registry.mjs`

`import-component-registry.mjs` converts an Airtable component-registry CSV export into one YAML file per component under `docs/components/registry/`. It's a one-time-per-refresh bootstrap tool, not a sync — see [docs/components/registry/README.md](../docs/components/registry/README.md) for why hand-editing YAML directly is the expected long-term workflow rather than re-running this against Airtable repeatedly.

`lint-registry.mjs` validates the generated (or hand-edited) YAML: every `children`/`parents` reference must resolve to a real component `id`, and every `level` must be one of the five confirmed values (primitive, element, object, widget, layout).

```bash
npm run import:registry     # regenerate docs/components/registry/*.yaml from the stored CSV (overwrites hand edits)
npm run validate:registry   # check registry references and levels are internally consistent
```

Both are deliberately dependency-free — the CSV parser and the YAML reader are small and purpose-built rather than pulling in a real CSV/YAML library, per the "keep tools/ small" rule below. If the registry schema grows meaningfully more complex, that trade-off should be revisited rather than the regexes stretched further.

## Future candidates

Not built yet — see [docs/decisions/0001-figma-connection-model.md](../docs/decisions/0001-figma-connection-model.md):

- A Figma REST API script to pull variable snapshots and/or component screenshots automatically, now that a real component inventory exists to point it at (`docs/components/registry/`).
- Link/heading/duplicate-rule validation across skill sources (master doc [§19](../docs/master-document.md#19-skill-source-and-distribution-architecture) mentions this as a build-model goal; not implemented — `build-skills.mjs` currently only validates structural completeness, not cross-skill rule conflicts).
