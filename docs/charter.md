# Stylos — Charter

What the system is for, what it is like, and where its boundaries are.

Rules of the design language live in [`docs/foundations/`](foundations/README.md); how the system is put together is in [`ARCHITECTURE.md`](../ARCHITECTURE.md). This document is the level above both: it says what those rules are in service of.

---

## Purpose

Stylos exists to provide a **reusable but recognizably authored** system for complex web products. It should make interface design faster and more consistent without becoming a visually neutral collection of generic controls.

The system is intended to:

- provide a coherent set of foundations and reusable interface components;
- support dense application interfaces rather than only marketing pages;
- encode visual and behavioural decisions in variables, styles, components, and public component properties;
- make light, dark, and eventually client-specific themes possible without rebuilding components;
- preserve a distinct classical and structural character across products;
- reduce manual design decisions and uncontrolled local overrides;
- support consistent reconstruction of external references through semantic mapping;
- form the design source for a later Svelte implementation and its documentation surface;
- remain maintainable by a single owner at this stage;
- become packageable and explainable enough for future commercial distribution.

## Character

The name and character of Stylos are associated with the column, antiquity, architecture, and constructed proportion. The intended qualities:

- **classical** rather than fashionable
- **strict** rather than casual
- **structural** rather than decorative
- **measured** rather than arbitrary
- **distinctive** without preventing product customization
- suitable for **complex, tool-like products**

These govern composition, rhythm, density, and the relationships between elements. They are the system's character, not the arithmetic of its scales — those are settled in [`foundations/`](foundations/README.md) on their own terms.

## The customization boundary

Stylos supports themes and product-specific content while keeping its own **component anatomy, scale, typography logic, interaction patterns, and proportional character**.

Customization happens through documented semantic variables and supported component properties — not by overriding component internals. This is the line that makes the system a system: everything above it is a product's business, everything below it is Stylos's.

---

## Scope

### Current

- Figma variables and styles
- design-token architecture
- colour, typography, spacing, sizing, icon, radius, border and effect foundations, as far as each is defined
- Figma components and component sets
- component API conventions
- component documentation
- naming and structural rules
- Figma Agent skills for repeatable operations and audits
- a reproducible build compiling modular skill sources into an importable Figma Agent document
- a repository structure for documentation, tokens, skills, and build tools

### Planned

- a Svelte component package
- a web documentation surface
- design-to-code mapping between Figma assets and Svelte components
- automated validation and linting where Figma's APIs allow reliable checks
- commercial packaging, licensing and support rules, if the system is released externally

### Not in scope now

Stylos is not currently intended to:

- support native mobile applications
- support native desktop UI toolkits
- provide a finished frontend implementation
- reproduce screenshots pixel-for-pixel
- import another product's visual language into Stylos
- make Figma and code bidirectionally editable before a reliable workflow exists
- automate destructive component repairs without review
- treat every raw value as an error when a documented exception applies
- become an unopinionated white-label kit with no visual identity

The last one is not a scoping detail. A system that can be configured into anything has no character to preserve, and preserving a character is the point.

---

## Principles

**Components are public APIs.** Variant properties, text properties, booleans, instance swaps, their order, their defaults, and the combinations that are supported — all of it is the component's contract, and all of it has to be understandable and consistent across the library. Renaming a property is a breaking change, not a tidy-up. The contract is spelled out in [`foundations/naming.md`](foundations/naming.md) and [`components/STANDARD.md`](components/STANDARD.md).

**Variables before raw values.** Anything the system has a token for resolves to a variable or a valid style. A raw value is allowed where it is genuinely external layout capacity, derived geometry, or another documented exception — not because it was quicker.

**Explicit exceptions over hidden inconsistency.** Optical compensation, derived dimensions and similar valid exceptions are named and written down. An exception stays the size of the case it covers; it does not widen into general permission for unbound values. The audit skill implements exactly this distinction, and it is why it reports some unbound values as information rather than as faults.

**One authored rule, many outputs.** Rules and automation sources are modular and maintained in one place. Generated documents, token files and future web documentation are outputs of an authored source, never independently edited copies. Where this is violated, the copies drift and the system starts contradicting itself — which is the failure mode this project has already had to correct more than once.

---

## Succeeding when

- a designer can identify the correct component and configure it without opening the main component;
- common interface decisions resolve to semantic roles and supported component properties;
- theme changes happen through variables rather than local edits;
- reference reconstruction preserves product logic without copying another visual system;
- published components pass naming and integrity checks;
- component documentation explains behaviour, not merely appearance;
- the token record and skill builds are reproducible;
- Figma and future Svelte APIs can be mapped deliberately;
- breaking changes have a migration and deprecation path;
- the system stays distinctive while supporting different products.
