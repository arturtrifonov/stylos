# 0006 — Proportional logic: character vs. arithmetic

**Status:** Accepted
**Date:** 2026-08-22

## Problem

Master doc §5.2 states that "Fibonacci numbers and derivatives are intended to influence token scales, spacing, sizing, and relationships," and §12.1 repeats it: "Spacing and size scales are intended to use Fibonacci values or deliberate derivatives." `docs/foundations/spacing.md` carries the same claim as its one confirmed fact.

The Figma library does not implement a Fibonacci-derived scale and never has. The scale in use is built on a **base of 8**, with variables named as a ratio to that base — `s-1_000` = 8, `s-1_500` = 12 — and with resolution that decreases as values grow rather than following any sequence. It has been in use long enough to be bound throughout the component library.

The documentation has therefore been describing an intention that was never built, as though it were a rule.

## Decision

**The base-8 ratio scale is the system's proportional arithmetic. The classical references are its character, not its formula.**

Two statements, kept apart on purpose:

1. **Arithmetic.** Spacing, sizing, radius, and typography scales are built on a base of 8, named as ratios to that base. Values come from the scale; the scale is not re-derived per component.
2. **Character.** The column, antiquity, constructed proportion, and the golden ratio remain what Stylos *is* — classical rather than fashionable, strict rather than casual, structural rather than decorative, measured rather than arbitrary. They govern composition, rhythm, density, and the relationships between elements. They do not govern which integers are in the scale.

The Fibonacci framing in master doc §5.2 and §12.1 and in `spacing.md` is **withdrawn as a description of the scale**.

## Why this way round

The alternative — treat Fibonacci as the real target and the current scale as interim — would mean re-deriving every spacing, sizing, and radius value and rebinding them across 96 components, on the strength of a document that has never matched the library. The cost is large and the benefit is a mathematical property no user perceives.

The master document already argues against itself here: §5.2 says these principles "should produce repeatable relationships, not force every individual measurement into a mathematical sequence when usability or implementation makes that inappropriate." A dense desktop interface on an 8px grid is exactly the case that sentence describes. This record resolves the contradiction toward the half that was actually built.

Nothing about the system's character depends on the arithmetic. A column's proportion is a ratio, not an integer sequence, and ratio naming (`s-1_500`) expresses that better than Fibonacci integers would.

## Basis

The owner, who is the source of truth for what the Figma library contains ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §1, governance §23.1), states that the implemented scale is base-8. That is what this record rests on.

This record deliberately does **not** list the scale's step values. An earlier draft took them from JSON files found outside the repository whose provenance was never established; that citation is removed. The exact values are ratified in ADR 0007 from a confirmed export — see [`PLAN.md`](../../PLAN.md) 1.1.

## Consequences

- `docs/foundations/spacing.md` and `sizing.md` drop the Fibonacci claim and state a base-8 ratio scale instead, without values until 0007.
- `docs/charter.md`, when master doc §5 is extracted, carries the classical framing with the arithmetic claim removed.
- The spacing naming-model research ([`PLAN.md`](../../PLAN.md) 1.2) is not a blank-page decision: ratio-to-base is already implemented and in use, so that research reviews a working model rather than selecting among seven candidates. It should still run — "already built" is not "right" — but its default answer is "keep what exists."
- Anyone arguing for a new spacing value must place it on the base-8 scale or make a case for changing the scale. "It's a Fibonacci number" stops being an argument.

## Follow-up

- ADR 0007 ratifies the exact step values from a verified export.
- Check whether the typography scale follows the same base-8 ratio logic. If it does, state it once in `tokens.md` rather than twice.
