# docs/

Authored design-system knowledge. Written and maintained by hand — none of it is generated.

| | |
| --- | --- |
| [`charter.md`](charter.md) | what the system is for, its character, its scope and boundaries |
| [`foundations/`](foundations/README.md) | the rules of the design language — colour, typography, spacing, sizing, naming, icons, effects |
| [`components/`](components/README.md) | the documentation standard and the component registry |
| [`specs/`](specs/README.md) | work orders — what to build, disposable once built |
| [`decisions/`](decisions/README.md) | the few boundaries expensive enough to reverse that they earn a record |
| [`research/`](research/README.md) | open investigations that have not produced a rule yet |

## Editorial rules

- **A rule lives in one place**, with its reasoning in a sentence beside it. If a rule needs restating somewhere else, link instead.
- **Values are not transcribed.** Token values live in [`tokens/`](../tokens/README.md) and are rendered by `npm run tokens:report`. A number copied into prose is wrong at the next change in Figma, and a wrong number in a foundation document gets built against.
- **Where a skill defines a rule for its own operation, the skill is the source.** Link to it rather than restating it.
- **Do not invent a value to fill a gap.** If something is not settled, say so and point at the stage in [`PLAN.md`](../PLAN.md) that settles it.
