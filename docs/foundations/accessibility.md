# Accessibility target and browser baseline

Status: Confirmed
Scope: The conformance target and the browser floor everything else is judged against; per-topic accessibility rules live with their topic.

Two bars in one document, because they answer the same question — *may this ship?* — and a judgement split across two files is how the two halves drift apart. The accessibility target is what a contract's findings are judged against; the browser baseline is the floor a CSS or platform feature must clear before `@stylos/ui` may rely on it.

## The target

### FND-ACCESSIBILITY-01 — The conformance target is WCAG 2.2, Level AA

**MUST.** Every design and implementation decision is judged against WCAG 2.2, Level AA.

Why: this ratifies practice rather than introducing a bar. Every criterion citation in the registry already reads WCAG 2.2, and every cited criterion is Level A or AA — the heaviest by far is SC 2.5.8 Target Size (Minimum), which *is* the AA bar; its AAA counterpart (SC 2.5.5, 44px) would flip those findings and is not the target.

- **2.2 over 2.1** because it is the current W3C Recommendation, and because 2.2 AA contains 2.1 AA — the only removal is SC 4.1.1 Parsing, obsolete by W3C's own errata. Conforming to 2.2 AA therefore also covers what EN 301 549 asks for via WCAG 2.1 AA, which matters from the moment the charter's commercial distribution happens: the European Accessibility Act has been enforceable since June 2025.
- **AA over AAA** because W3C itself does not recommend AAA as a general policy — it is not achievable for all content — and because nothing in the registry aims at it.

Serves: PRN-07.

### FND-ACCESSIBILITY-02 — One ARIA authority: WAI-ARIA 1.2, patterns per the APG

**MUST.** A role means what **WAI-ARIA 1.2** says it means, and a composite pattern behaves as the **ARIA Authoring Practices Guide** says it behaves.

Why: two authorities would have to be reconciled, per component, by whoever noticed. Zag.js implements the APG patterns, so [decision 0002](../decisions/0002-frontend-stack.md) and this target name the same source rather than adding a second one.

### FND-ACCESSIBILITY-03 — A finding cites its criterion

**MUST.** An accessibility finding names what it fails, as `WCAG 2.2 SC n.n.n` or `WAI-ARIA 1.2, <role or pattern>`.

Why: it is the form every existing citation already takes, and a finding without one cannot be re-checked — the next reader cannot tell whether the thing was measured or felt.

Checked by: `npm run validate:registry` reports a `warning` or `fail` that names no criterion.

## What the target binds

Both sides of the system, asymmetrically:

- **Contracts judge the design against it.** Target size, contrast, use of colour are properties of what Figma holds, and the registry records findings about them component by component. The vocabulary — `warning`, `fail`, `open`, `requires` — is defined in [`registry/README.md`](../components/registry/README.md); this document is the bar those statuses refer to. A `warning` means *fails a criterion of this target* and ships through a stated exception; without a named target the status meant nothing.
- **Conformance is claimable only of the rendered package.** A Figma library is not web content; WCAG applies to what a browser shows. Stage 5's accessibility tests run against this target, and only they can turn recorded findings into a conformance statement.

## The browser floor

### FND-ACCESSIBILITY-04 — A feature is relied on when it is Baseline Widely available

**MUST.** A CSS or platform feature may be relied on once it is **[Baseline Widely available](https://web.dev/baseline)** — interoperable across the core browser set and stable for 30 months.

Why: not a browser list, deliberately.

- **It is checkable mechanically.** `web-features` data and caniuse answer "is X widely available" with a lookup, which is the shape every gate in this project aims for — a check, not a judgement call.
- **It is maintained by someone else.** A version list authored here ("last 2 versions of…") is a moving target nobody re-evaluates on a schedule; it would be stale within a quarter, and this repository already knows what copied facts do.
- **It is stricter than the scope strictly needs, and that is accepted.** Baseline's browser set includes mobile browsers; Stylos is desktop-only. A feature held back solely by a browser outside the scope is exactly what the exception mechanism is for.

Exception: a feature below the floor may be used where the code states which feature, why, and what happens in a browser without it — a `@supports` fallback, or a degradation that loses polish rather than function. Exceptions work like raw values in Figma: allowed, named, and the size of the case they cover. An exception nobody wrote down is a bug.

Serves: PRN-01.

The current CSS output is comfortably inside the floor — custom properties have been universal for years — so the floor's first real work is in Stage 5, deciding questions of the form "may the package use `:has` / nesting / `color-mix`".

## Open

- **An assistive-technology support matrix** — which screen readers, paired with which browsers, the package is tested against. Deferred deliberately: a matrix is a testing commitment, and it has no reader until Stage 5's accessibility tests exist ([`PLAN.md`](../../PLAN.md) Stage 5). Until then, nothing here claims screen-reader support; the `requires` findings in the registry record what an implementation must do, not what has been verified.
