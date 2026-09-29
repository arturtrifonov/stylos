# Naming in the Figma implementation

The global naming contract is [docs/foundations/naming.md](../docs/foundations/naming.md). This document describes how the Figma library represents it; it does not define another set of design rules.

## Names and descriptions

The Assets panel uses `/` to group components. An instance takes the last segment of the component name, which is why a self-contained component name matters there (FND-NAMING-07).

Tool-generated names such as `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1` and `Variant 1` do not identify a role (FND-NAMING-02). [`stylos-naming-cleanup`](../skills/src/naming-cleanup/SKILL.md) replaces them with role names.

A component's description is derived from its registry entry by [`stylos-description-sync`](../skills/src/description-sync/SKILL.md). It carries the nested-use explanation required by FND-NAMING-11 without adding a marker to the name. The description is visible in the Assets panel and Dev Mode.

## Property representation

Figma has variant, text, boolean and instance-swap component properties. These are tool representations, not the registry's full property vocabulary.

A two-valued condition can be drawn with a boolean property or variants. A three-valued selection such as `false`, `true`, `mixed` needs variants. `is checked` keeps its meaning in both cases; the Figma property type does not define that meaning.

Focus can coexist with pointer interaction. The selection-control components draw it with the `is focused` boolean rather than a mutually exclusive `state` value. Properties used only to draw a state that code derives itself belong in the entry's `figma_notes`, not its public `api`. The same applies to a presentation control such as `has scrollbar`.

`Icon.name` is a string identifier in the contract. The current Figma implementation represents the choice by swapping an icon instance, not by exposing text content. Its representation is recorded in [Icon's `figma_notes`](../docs/components/registry/icon.yaml).

## Panel order and controlled groups

Figma displays variant properties and component properties in separate sections. FND-NAMING-27 gives the relative order of variant properties; FND-NAMING-29 gives the relative order of the other properties. The sections are read separately, never as one merged list.

The registry records a controlled group through `controls`, with adjacency in `api` (FND-NAMING-28). The Figma panel shows the same group filtered by section. A variant-level setting such as `icon position` remains in the variant section, so it cannot sit beside a boolean in the component-property section. That is a display limitation, not a change to the contract.

An implementation-only control also needs a predictable panel position. The naming-cleanup skill uses the canonical lists as a reference for these controls, including `has scrollbar`, even when they are absent from `api`.

The Plugin API's property-key order does not establish the visible panel order, and the skill cannot safely reorder properties without affecting instance bindings. It prints the canonical order for manual comparison and adjustment; its procedure is defined in the skill itself.
