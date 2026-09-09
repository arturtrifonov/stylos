# CLAUDE.md

Working rules for agent sessions in this repository. The flow they implement is normative in [`ARCHITECTURE.md`](ARCHITECTURE.md) §7 and was built by [SPEC 0008](docs/specs/0008-development-and-release-flow.md); the git hooks in `.githooks/` and the shared `.claude/settings.json` are the controls — this file is the guidance.

## Division of labour

**Decisions, specs, architecture and review happen in the decisions session. Implementation happens here, in Claude Code, in a branch.** If a task turns out to need a decision — a new rule, a changed boundary, a versioned contract — the default is that it goes back to a spec, it is not improvised mid-implementation.

**Amended 2026-09-06: a decision may be made in an implementation session when the human makes it there, explicitly.** Early development surfaces contract gaps mid-build constantly, and routing every one through the decisions session is slower than the failure it prevents. The line that may not be crossed is awareness: the agent states the decision being taken, in as many words, before building on it — a decision that passes in the background, implied by a diff, is the thing this rule forbids. The affected spec is amended in the same PR (a dated amendment note, in place), so the paper record never denies the code.

## Git

- **Never commit to `master`. Never `git merge`. Never `git tag`. Never push to `master`.** Work goes to a branch off `master` and reaches it through `gh pr create` and a squash-merge on GitHub. Releases are a person's act, made through the release ritual (SPEC 0008 §7) — never by an agent.
- The PR title is the squash commit subject, in the imperative. The PR body holds the `CHANGELOG.md` lines the change earns.
- Head branches are deleted after merge.

## Definition of done for a pull request

- `npm test`, `npm run validate:registry`, `npm run validate:rules`, `npm run validate:skills` and `npm run tokens:check` all pass — run all five before opening the PR. (`npm test` runs `validate:rules` too; run it on its own when the change touches a guideline.)
- **A rule of the design language is written as a rule block** — an ID, a level, a statement, a `Why:` — in the file of its topic under `docs/foundations/`, `docs/behavior/`, `docs/patterns/` or `docs/content/`. The grammar is [`docs/RULES.md`](docs/RULES.md); it is not a house style but the thing that makes a rule citable and a citation checkable. Cite a rule by ID; never restate one.
- **Every document describing a capability the PR changes is corrected in the same PR.** A change to how the system is built touches `ARCHITECTURE.md`; a change to sequence touches `PLAN.md`; a finished spec's row moves to *Built* in `docs/specs/README.md`. A built feature sitting against documents that deny it is the failure this line exists to prevent.
- A `## [Unreleased]` line in `CHANGELOG.md` when the change is worth a release note.
- **Generated output is never edited by hand.** `build/`, `packages/*/dist/`, `tokens/*.yaml` (written by `npm run tokens:import`) and `skills/dist/` change only by rebuilding their source.

## Implementation stack

Component work in `packages/ui` is Svelte 5 with TypeScript ([decision 0002](docs/decisions/0002-frontend-stack.md)). Use the `sveltejs/ai-tools` plugin and its autofixer for Svelte work — tooling set up by [SPEC 0009](docs/specs/0009-stylos-ui-package.md).
