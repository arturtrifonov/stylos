# figma/variables/exports/

Dated, immutable Figma Variables export snapshots. Do not edit a snapshot after it is committed — a correction is a new, later-dated file or directory. See [../README.md](../README.md) for how a snapshot is produced.

## Snapshots

| Snapshot | Date | Source file | Format |
| --- | --- | --- | --- |
| [`2026-02-22.json`](2026-02-22.json) | 2026-02-22 | not recorded | plugin export — raw `variables`/`collections`, `VARIABLE_ALIAS` references preserved |
| [`2026-08-22/`](2026-08-22/README.md) | 2026-08-22 | [Stylos / Styles](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles) | DTCG per collection and mode, aliases resolved |

A snapshot must record **which Figma file it came from**. `2026-02-22.json` predates that rule and its source is unknown, which is enough reason not to build anything on it.

## Reading a snapshot

```bash
npm run report:tokens     # render the newest snapshot's actual values
npm run validate:tokens   # check the alias graph is still recoverable
```

Foundation documents do not transcribe token values — they describe structure and rules and defer to this command. See [`tools/README.md`](../../../tools/README.md).

## Cadence

There is none, and that is the standing weakness (`ARCHITECTURE.md` §5, break 2). Until a Figma REST script exists ([`PLAN.md`](../../../PLAN.md) Stage 2), the rule is: **export before starting any work that reads token values, not after finishing it** — and never read values from a file that did not come out of Figma through a deliberate export.
