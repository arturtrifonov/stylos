# skills/

Figma Agent skills, authored as modular sources and compiled into one Markdown document for manual import into Figma Agent. Why the sources are modular and the distribution is a single file is explained below.

## Why modular source + monolithic distribution

Figma Agent imports a single document. Maintaining four-plus skills as one growing file would make each skill's own scope, version, and changelog impossible to track cleanly. So:

- **`src/`** — one directory per skill, each with its own `SKILL.md` (YAML frontmatter with `name`, `description`, and `metadata.version`, then the skill body) and, where useful, its own changelog.
- **`src/shared/`** — rules referenced by more than one skill (e.g. the naming contract, canonical size values), so they're defined once and imported rather than copy-pasted with the risk of drifting apart. Empty for now — nothing has been factored out yet; see [src/shared/README.md](src/shared/README.md).
- **`targets/figma-agent.md`** — configuration for the one current build target: which skills to include and in what order.
- **`dist/`** — generated output only. Never hand-edit anything in `dist/` — it's overwritten on every build and marked as generated in its own header.

## Building

```bash
npm run build:skills
```

Runs [`tools/build-skills.mjs`](../tools/build-skills.mjs), which reads `targets/figma-agent.md` for the include order, concatenates each listed skill's `SKILL.md`, and writes `dist/stylos-figma-agent.md`. Import that file into Figma Agent manually. Automated installation is not available, and the manual step is accepted rather than worked around.

## Current skills

| Skill | Version | Mode | Source |
| --- | ---: | --- | --- |
| `stylos-naming-cleanup` | 0.9 | Renames directly; reports the resulting state | [src/naming-cleanup/SKILL.md](src/naming-cleanup/SKILL.md) |
| `stylos-component-integrity-check` | 0.3 | Read-only | [src/component-integrity-check/SKILL.md](src/component-integrity-check/SKILL.md) |
| `stylos-reference-reconstruction` | 0.2 | Build directly unless material product ambiguity exists | [src/reference-reconstruction/SKILL.md](src/reference-reconstruction/SKILL.md) |
| `stylos-description-sync` | 0.1 | Writes descriptions from the repository; asks before overwriting a non-empty one | [src/description-sync/SKILL.md](src/description-sync/SKILL.md) |

**How to tell which build is loaded in Figma.** The `metadata` block is repository-only — Figma does not carry it, so a version cannot round-trip on its own. It carries `description`, so `tools/build-skills.mjs` appends the source's `metadata.version` to each skill's description when it compiles. Figma Agent then shows the version beside the skill, and a loaded build can be identified by reading it.

The version is written by the build, never typed into the description by hand. A hand-written number is a claim about a file, and it is wrong from the moment the file changes without it — which is exactly when the question gets asked.

That answers *which* build is loaded. Whether `dist/` matches the sources at all is a separate question, and `npm run validate:skills` answers it.

## Rules for editing a skill

- Bump `metadata.version` in the skill's own `SKILL.md` frontmatter on any behaviour change. The build carries it into the compiled description; do not write a version into the description yourself.
- Don't let two skills define the same rule differently — if they need to share a rule, move it to `src/shared/` and reference it.
- **A closed list may be restated here; an authored rule may not.** `state`, `validation` and the canonical size values are short, stable, and needed at every step, so they are written into a skill verbatim; changing one means changing both places. A *rule* that carries reasoning — a size profile, the colour model — belongs in `docs/foundations/` and is cited rather than retold: two prose copies of one rule drift, and the skill's copy is the one nobody re-reads.
- **Figma Agent can now reach the repository, and a skill should prefer that over a copy.** The GitHub connector gives it `wrgraff/stylos`, so a skill can be told to read a file at a path instead of carrying its contents — `stylos-description-sync` is built entirely on this. Two constraints come with it. It reads **GitHub, not a working copy**, so unpushed work does not exist to a skill; and it needs **a deterministic address, not a search**, because "find the entry for this component" has a failure mode that "read `docs/components/registry/checkbox-input.yaml`" does not. Give a skill a derivation rule, not a hint.
- **A list of examples is not a whitelist.** Where a skill illustrates values rather than bounding them, say so in the skill — otherwise the illustration gets enforced later as the permitted set, which is how `stylos-naming-cleanup` ended up with two different `tone` lists.
- Run `npm run build:skills` after any change and re-import the regenerated `dist/stylos-figma-agent.md` into Figma Agent — the dist file is not auto-synced to Figma.
