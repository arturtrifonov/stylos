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
| `stylos-naming-cleanup` | 0.7 | Inspect, plan, then rename unless direct cleanup requested | [src/naming-cleanup/SKILL.md](src/naming-cleanup/SKILL.md) |
| `stylos-text-sizing` | 0.2 | Apply directly when scope and mapping are unambiguous | [src/text-sizing/SKILL.md](src/text-sizing/SKILL.md) |
| `stylos-component-integrity-check` | 0.2 | Read-only | [src/component-integrity-check/SKILL.md](src/component-integrity-check/SKILL.md) |
| `stylos-reference-reconstruction` | 0.1 | Build directly unless material product ambiguity exists | [src/reference-reconstruction/SKILL.md](src/reference-reconstruction/SKILL.md) |

Note on versions: the `metadata` block in each `SKILL.md` is repository-only — Figma's export does not carry it, so a version number cannot round-trip. Whether a loaded skill matches this repository is answered by comparing the text, not by trusting a number.

## Rules for editing a skill

- Bump `metadata.version` in the skill's own `SKILL.md` frontmatter on any behavior change.
- Don't let two skills define the same rule differently — if they need to share a rule, move it to `src/shared/` and reference it.
- Run `npm run build:skills` after any change and re-import the regenerated `dist/stylos-figma-agent.md` into Figma Agent — the dist file is not auto-synced to Figma.
