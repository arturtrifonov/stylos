# figma/variables/

Everything here concerns Figma Variables specifically (as opposed to styles, components, or Figma-native documentation, which stay in Figma).

- [`exports/`](exports/README.md) — dated, immutable native Variables export snapshots.

## How a snapshot gets here

1. In Figma, use the native Variables export (not a plugin, not Tokens Studio) to produce a JSON file.
2. Drop it into `exports/` named `YYYY-MM-DD.json` (or `YYYY-MM-DD-<note>.json` if more than one snapshot is taken the same day — e.g. before/after a specific change).
3. Add a line to `exports/README.md` naming the date and what changed since the previous snapshot, and to the root [`CHANGELOG.md`](../../CHANGELOG.md) if the change is user-visible (new tokens, renamed roles, mode changes).
4. Never edit a snapshot after it's committed. A correction is a new, later-dated snapshot.
