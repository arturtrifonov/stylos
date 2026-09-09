# Stylos — Charter

What the system is for, what it is like, and where its boundaries are.

Rules of the design language live in [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md) and [`content/`](content/README.md), each written in the form [`RULES.md`](RULES.md) fixes; how the system is put together is in [`ARCHITECTURE.md`](../ARCHITECTURE.md). This document is the level above both: it says what those rules are in service of.

---

## Character

Stylos is inspired by the principles ancient architecture rests on: modularity, precision, coherence, and attention to detail.

The Parthenon stands on a strict module; so do the components of Stylos. And as the Greek architects adjusted the thickness of their columns so that they would look straight to a person standing before them, we make corrections just as small, to bring the same harmony into an interface.

Why this approach? Stylos was made to carry data-heavy interfaces, and it is those small corrections that let a dense screen read as a light one.

Stylos reduces friction through visual harmony.

## Purpose

Stylos exists to provide a reusable system for complex web products.  
The system is intended to:

- provide a coherent set of foundations and reusable interface components;
- support dense application interfaces rather than marketing pages;
- encode visual and behavioural decisions in variables, styles, components, and public component properties;
- carry light and dark as **modes** of the semantic layer, so one component and one variable render both without a rebuild;
- keep **theming** a separate axis from the mode: a product recolours Stylos by rebinding slots, and eventually by supplying its own hue group, never by editing roles or the mode mechanism;
- reduce manual design decisions and uncontrolled local overrides;
- support consistent reconstruction of external references through semantic mapping;

## The customization boundary

Stylos supports themes and product-specific content while keeping its own **component anatomy, scale, typography logic, interaction patterns, and proportional character**.

Customization happens through documented semantic variables and supported component properties — not by overriding component internals. This is the line that makes the system a system: everything above it is a product's business, everything below it is Stylos's.

---

## Principles

Yet to fill
