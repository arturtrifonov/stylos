# Naming in the Figma implementation

The global naming contract is [docs/foundations/naming.md](../docs/foundations/naming.md). This document is the source for naming conventions specific to authoring the Figma library. These conventions do not constrain other implementations or define their public APIs.

## Names and descriptions

Component descriptions are derived from registry entries by [`stylos-description-sync`](../skills/src/description-sync/SKILL.md). They carry the nested-use explanation required by FND-NAMING-11. Descriptions are visible in the Assets panel and Dev Mode.

## Component organization

The Assets panel uses `/` to group components. The conventions for that hierarchy are:

- **Use slash groups for categories, not property values.** Size, state, icon presence and other configurable differences belong in variant or component properties. `Button / Primary / Medium / Hover / With Icon` forces the consumer to swap a whole instance instead of configuring it.
- **Make the last segment a self-contained component name.** Figma uses it as the instance name. `Button / Base` produces an instance named `Base`; use `Button Base` instead.
- **A category does not express composition.** Keep `Tab Item` top-level even when only `Tabs` uses it. Composition is recorded in the registry, not inferred from an Assets folder.
- **Prefer compound names where a slash group adds no useful category.** Use `Accordion Header` rather than `Accordion / Header`.
- **Publish nested library components under their ordinary names.** Do not hide them or add an `_` marker. Nested use is explained in the description. This convention concerns the Figma library, not whether a code implementation exports its internal helpers.

## Layer names

- Give every meaningful layer a role name instead of a default such as `Frame 1`, `Group 1`, `Rectangle 1`, `Text`, `Component 1` or `Variant 1`.
- Use the same name for equivalent layers across variants. This helps preserve overrides and lets the naming-cleanup skill compare the variants.
- Use sentence case: `Label text`, `Leading icon`, `Content`, `Actions`, `Background`, `Divider`, `Focus ring`.
- End a text layer's name with `text`, so its content and type bindings can be found without opening every layer.

[`stylos-naming-cleanup`](../skills/src/naming-cleanup/SKILL.md) applies these authoring conventions. Names still describe roles rather than appearance (FND-NAMING-03).

## Property representation

Figma has variant, text, boolean and instance-swap component properties. These are tool representations, not the registry's full property vocabulary.

A two-valued condition can be drawn with a boolean property or variants. A three-valued selection such as `false`, `true`, `mixed` needs variants. `is checked` keeps its meaning in both cases; the Figma property type does not define that meaning.

Focus can coexist with pointer interaction. The selection-control components draw it with the `is focused` boolean rather than a mutually exclusive `state` value. Properties used only to draw a state that code derives itself belong in the entry's `figma_notes`, not its public `api`. The same applies to a presentation control such as `has scrollbar`.

For drawing interaction states, the Figma vocabulary includes `state = default / hover / active / focus / disabled / read only`. This is a preview mechanism: interactive code derives pointer and focus states rather than asking the consumer to set them as public props.

`Icon.name` is a string identifier in the contract. The current Figma implementation represents the choice by swapping an icon instance, not by exposing text content. Its representation is recorded in [Icon's `figma_notes`](../docs/components/registry/icon.yaml).

Documentation and prototype controls such as `show annotations` and `show measurements` sit outside the public component API. Their names can describe the tool action; they are not exceptions to FND-NAMING-23, which applies to public API properties.

## Panel order and controlled groups

Figma displays variant properties and component properties in separate sections. FND-NAMING-27 gives the relative order of variant properties; FND-NAMING-29 gives the relative order of the other properties. The sections are read separately, never as one merged list.

The registry records a controlled group through `controls`, with adjacency in `api` (FND-NAMING-28). The Figma panel shows the same group filtered by section. A variant-level setting such as `icon position` remains in the variant section, so it cannot sit beside a boolean in the component-property section. That is a display limitation, not a change to the contract.

An implementation-only control also needs a predictable panel position. The naming-cleanup skill uses the canonical lists as a reference for these controls even when they are absent from `api`. Place `is focused` in the condition band, before `is required`, and `has scrollbar` in the presentation band, after `has overflow` and before component-specific properties. These draw a state in Figma; they are not public API props.

The Plugin API's property-key order does not establish the visible panel order, and the skill cannot safely reorder properties without affecting instance bindings. It prints the canonical order for manual comparison and adjustment; its procedure is defined in the skill itself.
