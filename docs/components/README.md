# docs/components/

One Markdown file per public component, named `<component-name>.md` (kebab-case, matching the component's Title Case Figma name — e.g. `icon-button.md` for `Icon Button`).

Every component document must follow the 20-point standard in master doc [§17](../master-document.md#17-component-documentation-standard): name/summary, purpose, use-when/do-not-use-when, architectural level, anatomy, public API in canonical order, property definitions, controlled groups, states, sizing, typography roles, token usage, composition, content guidance, accessibility, responsive behavior, examples, anti-examples, known limitations, and lifecycle status.

Nothing here yet — there is no current component inventory (master doc [§14.5](../master-document.md#145-component-inventory-status), [§27 item 10](../master-document.md#27-open-decisions)). Building that inventory is [Phase 3](../master-document.md#phase-3--component-documentation-and-coverage) work, and it should start with the components that already exist and are named in Figma today (Button is the only one currently described in detail — master doc [§14.4](../master-document.md#144-current-button-example)).

## What belongs here vs. in Figma

Figma stays the live source for StateDiagrams, PropTables, anatomy diagrams, variant matrices, and other spatial/visual documentation (master doc [§21.2](../master-document.md#212-figma-native-documentation)). This directory holds the parts that are easier to keep precise as text: purpose, boundaries against adjacent components, property definitions and defaults, composition rules, content guidance, and lifecycle status. Don't duplicate a PropTable here that already lives correctly in Figma — link to it (once Figma links are recorded in the [project passport](../master-document.md#2-project-passport)) or reference the component by name.
