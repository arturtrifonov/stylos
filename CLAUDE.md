# CLAUDE.md

Working rules for agent sessions in this repository. The flow they implement is normative in [`ARCHITECTURE.md`](ARCHITECTURE.md) §7 and was built by [SPEC 0008](docs/specs/0008-development-and-release-flow.md); the git hooks in `.githooks/` and the shared `.claude/settings.json` are the controls — this file is the guidance.

## Division of labour

**Decisions, specs, architecture and review happen in the decisions session. Implementation happens here, in Claude Code, in a branch.** If a task turns out to need a decision — a new rule, a changed boundary, a versioned contract — it goes back to a spec, it is not improvised mid-implementation.

## Git

- **Never commit to `master`. Never `git merge`. Never `git tag`. Never push to `master`.** Work goes to a branch off `master` and reaches it through `gh pr create` and a squash-merge on GitHub. Releases are a person's act, made through the release ritual (SPEC 0008 §7) — never by an agent.
- The PR title is the squash commit subject, in the imperative. The PR body holds the `CHANGELOG.md` lines the change earns.
- Head branches are deleted after merge.

## Definition of done for a pull request

- `npm test`, `npm run validate:registry`, `npm run validate:skills` and `npm run tokens:check` all pass — run all four before opening the PR.
- **Every document describing a capability the PR changes is corrected in the same PR.** A change to how the system is built touches `ARCHITECTURE.md`; a change to sequence touches `PLAN.md`; a finished spec's row moves to *Built* in `docs/specs/README.md`. A built feature sitting against documents that deny it is the failure this line exists to prevent.
- A `## [Unreleased]` line in `CHANGELOG.md` when the change is worth a release note.
- **Generated output is never edited by hand.** `build/`, `packages/*/dist/`, `tokens/*.yaml` (written by `npm run tokens:import`) and `skills/dist/` change only by rebuilding their source.

## Implementation stack

Component work in `packages/ui` is Svelte 5 with TypeScript ([decision 0002](docs/decisions/0002-frontend-stack.md)). Use the `sveltejs/ai-tools` plugin and its autofixer for Svelte work — tooling set up by [SPEC 0009](docs/specs/0009-stylos-ui-package.md).
