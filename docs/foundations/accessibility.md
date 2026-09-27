# Accessibility

Status: Draft
Scope: The conformance target every design and implementation decision is judged against; an accessibility rule about one topic lives with that topic.

The target is the standard a contract's findings are judged against. It is what a `warning` or a `fail` in the registry refers to. The rules here set which standard that is, who defines what a role means, and what a finding has to name. How a particular surface meets the target is decided in the foundation for that surface.

Which browsers the package may rely on is not in this file. That is a constraint on the build, not a rule of the design language, and it is set out in [`ARCHITECTURE.md`](../../ARCHITECTURE.md) under Conventions.

## The target

### FND-ACCESSIBILITY-01 — The conformance target is WCAG 2.2, Level AA

**MUST.** Every design and implementation decision is judged against WCAG 2.2, Level AA.

Why: this confirms existing practice; it does not add a new requirement. Every criterion citation in the registry already reads WCAG 2.2, and every cited criterion is Level A or AA. The one with by far the most findings is SC 2.5.8 Target Size (Minimum), which *is* the AA criterion for target size. Its AAA counterpart (SC 2.5.5, 44px) would change those findings, and it is not the target.

- **2.2 over 2.1** because 2.2 is the current W3C Recommendation, and because 2.2 AA contains 2.1 AA. The only criterion removed is SC 4.1.1 Parsing, which W3C's own errata made obsolete. So conforming to 2.2 AA also covers what EN 301 549 asks for through WCAG 2.1 AA. Nothing is decided about distributing Stylos commercially, and the target must not be what rules it out: the European Accessibility Act has been enforceable since June 2025, and a product the Act covers has to meet EN 301 549.
- **AA over AAA** because W3C itself does not recommend AAA as a general policy: it cannot be met for all content. Nothing in the registry aims at it either.

The target holds when the design would look better without it. A lighter label looks calmer and a smaller hit area looks tidier, and in any one case the cost seems small. Where a design and the target disagree, the design changes.

### FND-ACCESSIBILITY-02 — One ARIA authority: WAI-ARIA 1.2, patterns per the APG

**MUST.** A role means what **WAI-ARIA 1.2** says it means, and a composite pattern behaves as the **ARIA Authoring Practices Guide** says it behaves.

Why: with two authorities, whoever noticed a difference would have to reconcile them, component by component. Zag.js implements the APG patterns, so decision 0002 and this target name the same source instead of adding a second one.

### FND-ACCESSIBILITY-03 — A finding cites its criterion

**MUST.** An accessibility finding names what it fails, as `WCAG 2.2 SC n.n.n` or `WAI-ARIA 1.2, <role or pattern>`.

Why: every existing citation already takes this form. A finding without a criterion cannot be checked again: the next reader cannot tell whether the problem was measured or only felt.

Checked by: `npm run validate:registry` reports a `warning` or `fail` that names no criterion.

## What the target binds

It binds both sides of the system, in different ways:

- **In contracts, the design is judged against it.** Target size, contrast and use of colour are properties of what Figma holds, and the registry records findings about them for each component. The status vocabulary — `warning`, `fail`, `open`, `requires` — is defined in [`registry/README.md`](../components/registry/README.md); this document is the standard those statuses refer to. Without a named target, those statuses meant nothing.
- **Conformance is a property of the rendered package.** A Figma library is not web content; WCAG applies to what a browser shows. Stage 5's accessibility tests run against this target, and only those tests can turn recorded findings into a conformance statement.

## Open

- **An assistive-technology support matrix** — which screen readers, paired with which browsers, the package is tested against. Deferred on purpose: a matrix is a commitment to test, and nobody needs it until Stage 5's accessibility tests exist ([`PLAN.md`](../../PLAN.md) Stage 5). Until then, nothing here claims screen-reader support. The `requires` findings in the registry record what an implementation must do, not what has been verified.
