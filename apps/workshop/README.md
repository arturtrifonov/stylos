# Workshop

Storybook for [`@stylos/ui`](../../packages/ui/README.md) — a local development surface, run from a checkout and never deployed ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §4).

The stories are **generated from the registry** by `tools/build-ui-stories.mjs` into `stories/generated/` (gitignored): one file per built component, a case per documented variant value. The "build the core set" gate is met when every generated story renders — an authored story cannot stand in for a documented variant.

```bash
npm run workshop
```

at the repository root regenerates everything and starts Storybook on port 6006. `npm run workshop:build` is the CI build.
