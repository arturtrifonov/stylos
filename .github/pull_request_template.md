<!-- The definition of done — ARCHITECTURE.md §7. The body below the checklist holds the CHANGELOG.md lines this change earns; the PR title is the squash commit subject, in the imperative. -->

- [ ] `npm test`, `npm run validate:registry`, `npm run validate:skills` and `npm run tokens:check` pass
- [ ] Every document describing a capability this PR changes is corrected in the same PR (`ARCHITECTURE.md` for how the system is built, `PLAN.md` for sequence, a finished spec's row moves to *Built* in `docs/specs/README.md`)
- [ ] A `## [Unreleased]` line is added when the change is worth a release note
- [ ] Generated output is not hand-edited — `build/`, `packages/*/dist/`, `tokens/*.yaml` and `skills/dist/` change only by rebuilding their source
