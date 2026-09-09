# docs/

Authored design-system knowledge. Written and maintained by hand — none of it is generated.

| | |
| --- | --- |
| [`charter.md`](charter.md) | what the system is for, its character, its scope and boundaries |
| [`RULES.md`](RULES.md) | the rules of rules — how one is written, identified, cited, narrowed and retired |
| [`foundations/`](foundations/README.md) | the visual language — colour, typography, spacing, sizing, naming, icons, effects, and the rest of what a surface is made of |
| [`behavior/`](behavior/README.md) | the laws components inherit — states, focus, keyboard, loading, validation, and what a surface does with no data |
| [`patterns/`](patterns/README.md) | one decided answer per recurring task — forms, tables, filtering, search, dialogs |
| [`content/`](content/README.md) | the words — voice, terminology, labels, error messages, formats |
| [`components/`](components/README.md) | the documentation standard and the component registry |
| [`specs/`](specs/README.md) | work orders — what to build, disposable once built |
| [`decisions/`](decisions/README.md) | the few boundaries expensive enough to reverse that they earn a record |
| [`research/`](research/README.md) | open investigations that have not produced a rule yet |

The four guideline directories are mostly empty and say so per file: [SPEC 0013](specs/0013-guideline-structure.md) created the whole set with a scope line each, so that a rule has somewhere to be written before it is decided. A file marked *Yet to fill* is a place, not a claim.

## Editorial rules

These are the rules for documents in general. The rules for **rules** — the ID, the block, the levels, precedence, lifecycle — are [`RULES.md`](RULES.md).

- **A rule lives in one place**, with its reasoning in a sentence beside it. If a rule needs restating somewhere else, link instead.
- **Values are not transcribed.** Token values live in [`tokens/`](../tokens/README.md) and are rendered by `npm run tokens:report`. A number copied into prose is wrong at the next change in Figma, and a wrong number in a foundation document gets built against.
- **Where a skill defines a rule for its own operation, the skill is the source.** Link to it rather than restating it.
- **Do not invent a value to fill a gap.** If something is not settled, say so and point at the stage in [`PLAN.md`](../PLAN.md) that settles it.
