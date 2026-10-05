# Accessibility

Status: Draft
Scope: The shared accessibility target and the evidence recorded against it; topic-specific requirements live with their topic, and implementation checks live with each implementation.

The system targets WCAG 2.2, Level AA. A component contract records the requirements it can meet itself and the conditions that depend on its use. Neither a contract nor an isolated component establishes the conformance of a complete interface.

## The target

### FND-ACCESSIBILITY-01 — The target is WCAG 2.2, Level AA

**MUST.** Assess design and implementation decisions against the applicable requirements of WCAG 2.2, Level AA.

Why: one shared target makes findings comparable across components and implementations, while applicability depends on the element's purpose and its use in an interface.

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) defines the target. Level AA includes all Level A and AA success criteria; AAA is not the system-wide target. Meeting a particular AAA criterion is still possible.

A component is assessed in the context its contract supports. An icon used as decoration has no separate information to announce; an icon-only button needs an accessible name for its action. The consumer's responsibility is part of that assessment, rather than evidence that the visual icon itself fails WCAG.

### FND-ACCESSIBILITY-02 — ARIA semantics follow WAI-ARIA

**MUST.** Use the meaning and requirements defined by WAI-ARIA 1.2 for any ARIA role, state or property.

Why: assistive technologies depend on shared semantics, so a role cannot acquire a different meaning in this system.

[WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) defines these semantics. It does not require every visual component to expose a role of its own.

### FND-ACCESSIBILITY-03 — A finding points to its source

**MUST.** Cite the applicable requirement behind an accessibility finding with a link to its source when that requirement is known.

Why: a source lets the next reader check the requirement and its exceptions without treating every recorded condition as an observed failure.

A WCAG citation identifies the version and success criterion, such as [WCAG 2.2 SC 2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum). An ARIA citation identifies the role, state or property, such as [WAI-ARIA 1.2, switch](https://www.w3.org/TR/wai-aria-1.2/#switch). Guidance can be cited as guidance, such as the [APG dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); it is not labelled as a WCAG criterion or an ARIA requirement.

A `requires` finding describes a condition the implementation or consumer fulfils. An `open` finding names the unresolved question; where its source requirement is not yet known, it records that gap instead of inventing a citation. A `warning` names the condition or standard-defined exception that can make the use conformant. A `fail` records a violation under the assessed conditions. The status vocabulary is defined in [registry/README.md](../components/registry/README.md#a11y).

Checked by: `npm run validate:registry` reports a `warning` or `fail` without a named criterion; source links, their relevance and the other statuses are checked in review.

## Components and complete interfaces

A component contract describes the conditions for accessible use. These can include a name supplied by its parent, an association with another element, or sufficient space around an interactive target. A visual part does not need to work as a complete interface on its own.

An implementation is checked for the requirements it controls, with representative uses of the component. The consumer is responsible for the requirements that depend on content and composition. An absence of recorded findings is not evidence that either has been checked.

[WCAG conformance](https://www.w3.org/TR/WCAG22/#conformance-reqs) is assessed for full pages and complete processes. Component checks provide evidence for that assessment; they do not establish conformance for a package or for every interface built with it. Assessment combines automated checks and human evaluation, as described in [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance).

A documented reason for shipping a known failure does not waive the target or make the assessed use conformant. A condition that the surrounding interface can fulfil is different from a failure that remains after those conditions are met.
