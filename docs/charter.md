# Stylos — Charter

What the system is for, what it is like, and where its boundaries are.

The rules of the design language live in [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md) and [`content/`](content/README.md), each written in the form that [`RULES.md`](RULES.md) sets. The principles they follow from are in [`principles.md`](principles.md). How the system is put together is in [`ARCHITECTURE.md`](../ARCHITECTURE.md). This document sits above all of them: it says what they are for.

---

## Character

Stylos is inspired by the principles ancient architecture rests on: modularity, precision, coherence, and attention to detail.

The Parthenon is built on a strict module, and so are the components of Stylos. The Greek architects adjusted the thickness of their columns so that they would look straight to a person standing in front of them. We make corrections just as small, to bring the same harmony into an interface.

Why this approach? Stylos was made for data-heavy interfaces, and those small corrections are what make a dense screen look light.

Stylos reduces friction through visual harmony.

## Purpose

Stylos exists to provide a reusable system for complex web products.  
The system is intended to:

- provide a coherent set of foundations and reusable interface components;
- support dense application interfaces rather than marketing pages;
- encode visual and behavioural decisions in variables, styles, components, and public component properties;
- implement light and dark as **modes** of the semantic layer, so that one component and one variable render both without a rebuild;
- keep **theming** separate from the mode: a product recolours Stylos by changing what the roles point at, and in future by supplying its own hue group, but never by renaming roles or editing the mode mechanism;
- reduce manual design decisions and uncontrolled local overrides;
- support rebuilding external references consistently, through semantic mapping.

## The customization boundary

Stylos supports themes and product-specific content while keeping its own **component anatomy, scale, typography logic, interaction patterns, and proportional character**.

Customization happens through documented semantic variables and supported component properties, not by overriding component internals. This boundary is what makes Stylos a system. Everything above it belongs to the product, and everything below it belongs to Stylos.

