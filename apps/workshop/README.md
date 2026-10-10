# Workshop

Storybook for [`@stylos/ui`](../../packages/ui/README.md) — a local development surface, run from a checkout and never deployed ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §4).

The stories are **generated from the registry** by `tools/build-ui-stories.mjs` into `stories/generated/` (gitignored): one Default playground per built component. Controls retain each contract’s variant vocabulary and defaults; individual property values do not create separate pages. Static component-page examples are generated independently.

```bash
npm run workshop
```

at the repository root regenerates everything and starts Storybook on port 6006. `npm run workshop:build` is the CI build.

Components needing a surrounding composition use an authored fixture in
`stories/fixtures/<Component>Example.svelte`. The generator passes each
Default’s args to that fixture, so Controls remain generated. Control kinds and variant vocabularies are projected from the registry,
including props with no default; they do not depend on docgen inference. Regeneration preserves the watched directory and removes stale
story files individually, keeping Storybook hot updates working.

Tooltip’s Default playground contains a real button to hover or focus.
Checkbox Input’s Default renders a native named checkbox. Checkbox Label
and Text also keep their Default playgrounds and Controls. Additional visual
matrices, interaction-test pages and form demonstrations are omitted from the workshop.

Button Base keeps Default followed by one `Icons playground` story. It renders a single live button; Controls independently select the leading and trailing marks from the active icon set and adjust their presence, size, tone, label and availability.

Link also keeps Default followed by Icons playground, with native navigation and independently configurable leading and trailing icons.

Button Inner follows the same Default and Icons playground convention, with one icon selected from the active set and an explicit action name. It has no size or tone controls.

Tag Fill and Tag Outline each keep Default followed by Icons playground. Controls cover five sizes, five tones, two text cases and independently selected decorative icons from the active set.
