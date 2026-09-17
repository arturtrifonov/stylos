# Accessibility

Status: Confirmed
Scope: The conformance target every design and implementation decision is judged against; per-topic accessibility rules live with their topic, and which browsers the package may rely on is a build constraint in [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7 rather than a rule of the design language.

The target is what a contract's findings are judged against — the bar a `warning` or a `fail` in the registry refers to. The rules here fix which standard that is, who says what a role means, and what a finding has to name; how a particular surface meets it is decided in the foundation of that surface.

## The target

### FND-ACCESSIBILITY-01 — The conformance target is WCAG 2.2, Level AA

**MUST.** Every design and implementation decision is judged against WCAG 2.2, Level AA.

Why: this ratifies practice rather than introducing a bar. Every criterion citation in the registry already reads WCAG 2.2, and every cited criterion is Level A or AA — the heaviest by far is SC 2.5.8 Target Size (Minimum), which *is* the AA bar; its AAA counterpart (SC 2.5.5, 44px) would flip those findings and is not the target.

- **2.2 over 2.1** because it is the current W3C Recommendation, and because 2.2 AA contains 2.1 AA — the only removal is SC 4.1.1 Parsing, obsolete by W3C's own errata. Conforming to 2.2 AA therefore also covers what EN 301 549 asks for via WCAG 2.1 AA, which matters from the moment the charter's commercial distribution happens: the European Accessibility Act has been enforceable since June 2025.
- **AA over AAA** because W3C itself does not recommend AAA as a general policy — it is not achievable for all content — and because nothing in the registry aims at it.

Serves: PRN-07.

### FND-ACCESSIBILITY-02 — One ARIA authority: WAI-ARIA 1.2, patterns per the APG

**MUST.** A role means what **WAI-ARIA 1.2** says it means, and a composite pattern behaves as the **ARIA Authoring Practices Guide** says it behaves.

Why: two authorities would have to be reconciled, per component, by whoever noticed. Zag.js implements the APG patterns, so decision 0002 and this target name the same source rather than adding a second one.

### FND-ACCESSIBILITY-03 — A finding cites its criterion

**MUST.** An accessibility finding names what it fails, as `WCAG 2.2 SC n.n.n` or `WAI-ARIA 1.2, <role or pattern>`.

Why: it is the form every existing citation already takes, and a finding without one cannot be re-checked — the next reader cannot tell whether the thing was measured or felt.

Checked by: `npm run validate:registry` reports a `warning` or `fail` that names no criterion.

## What the target binds

Both sides of the system, asymmetrically:

- **Contracts judge the design against it.** Target size, contrast, use of colour are properties of what Figma holds, and the registry records findings about them component by component. The vocabulary — `warning`, `fail`, `open`, `requires` — is defined in [`registry/README.md`](../components/registry/README.md); this document is the bar those statuses refer to. A `warning` means *fails a criterion of this target* and ships through a stated exception; without a named target the status meant nothing.
- **Conformance is claimable only of the rendered package.** A Figma library is not web content; WCAG applies to what a browser shows. Stage 5's accessibility tests run against this target, and only they can turn recorded findings into a conformance statement.

## Open

- **An assistive-technology support matrix** — which screen readers, paired with which browsers, the package is tested against. Deferred deliberately: a matrix is a testing commitment, and it has no reader until Stage 5's accessibility tests exist ([`PLAN.md`](../../PLAN.md) Stage 5). Until then, nothing here claims screen-reader support; the `requires` findings in the registry record what an implementation must do, not what has been verified.
