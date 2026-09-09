# Focus

Status: Partial
Scope: Focus visibility, order, initial focus, trapping, and return.

### BEH-FOCUS-01 — Focus is always visible

**MUST.** Every focusable element draws a focus indicator when it holds keyboard focus.

Why: a person navigating by keyboard who cannot see where they are has to press keys to find out, and every press is a commitment.

Checked by: `@stylos/ui` tests, per component.

### BEH-FOCUS-03 — Focus returns to the invoker

**MUST.** When an overlay closes, focus returns to the element that opened it.

Why: a reader who loses their place after a dialog has to find it again by hand; a screen-reader user has to find it blind.

Exception: an overlay that navigated away places focus on the new page's first heading.

## Open

- Whether a roving tabindex is the default inside a toolbar.
