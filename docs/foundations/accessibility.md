# Accessibility target and browser baseline

Status: Draft
Scope: The conformance target and the browser floor everything else is judged against; per-topic accessibility rules live with their topic.

This document sets two standards, because both answer the same question: *may this ship?* When one judgement is split across two files, the two halves come to disagree. The accessibility target is what a contract's findings are judged against. The browser baseline is the floor — the minimum a CSS or platform feature must meet before `@stylos/ui` may rely on it.

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

## The browser floor

### FND-ACCESSIBILITY-04 — A feature is relied on when it is Baseline Widely available

**MUST.** A CSS or platform feature may be relied on once it is **[Baseline Widely available](https://web.dev/baseline)** — interoperable across the core browser set and stable for 30 months.

Why: this is deliberately not a list of browsers.

- **It can be checked mechanically.** `web-features` data and caniuse answer "is X widely available" with a lookup. That is what every gate in this project aims to be: a check, not a judgement call.
- **It is maintained by someone else.** A version list written here ("last 2 versions of…") keeps changing, and nobody re-checks it on a schedule. It would be stale within a quarter, and this repository has already seen how copied facts go stale.
- **It is stricter than the scope needs, and that is accepted.** Baseline's browser set includes mobile browsers, but Stylos is desktop-only. The exception mechanism exists for exactly this case: a feature held back only by a browser outside the scope.

Exception: a feature below the floor may be used where the code states which feature it is, why it is used, and what happens in a browser without it — a `@supports` fallback, or a degradation that loses polish but not function. These exceptions work like raw values in Figma: allowed, named, and no wider than the case they cover. An exception nobody wrote down is a bug.

Serves: PRN-01.

The current CSS output is well within the floor: custom properties have worked in every browser for years. So the floor first matters in Stage 5, for questions such as "may the package use `:has` / nesting / `color-mix`".

## Open

- **An assistive-technology support matrix** — which screen readers, paired with which browsers, the package is tested against. Deferred on purpose: a matrix is a commitment to test, and nobody needs it until Stage 5's accessibility tests exist ([`PLAN.md`](../../PLAN.md) Stage 5). Until then, nothing here claims screen-reader support. The `requires` findings in the registry record what an implementation must do, not what has been verified.
