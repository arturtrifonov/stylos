# SPEC 0011 — The project website

**Status:** Built — 2026-09-06
**Date:** 2026-09-06

A work order for the publishable site. [`PLAN.md`](../../PLAN.md) §8 and [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §4 said a public documentation site was out of scope, and [SPEC 0010](0010-distribution-surface.md) §8 kept the generated pages local. **The owner reversed that on 2026-09-06, in the implementation session, explicitly** (the amendment rule in [`CLAUDE.md`](../../CLAUDE.md)): the generated tree becomes the site, the workshop is published inside it, and the tree is uploaded to the static host the project already uses — `stylos.arturtrifonov.com`, on Netlify. All three documents are amended in this spec's pull request.

What this spec does **not** cover is the deploy itself. Wiring Netlify to the repository, DNS, and the upload cadence are the owner's manual acts, outside the tree. This spec ends at a `build/` directory that can be uploaded as-is and is correct when it is.

---

## 1. What the site is

The generated pages already existed — a placeholder home, the registry view, one page per component ([SPEC 0002](0002-registry-viewer.md), [SPEC 0003](0003-component-page.md)). This spec replaces the placeholder with a real front page and dresses all three surfaces in one chrome, so the tree reads as a site rather than as three tools that share a directory.

The audience split from [decision 0002](../decisions/0002-frontend-stack.md) §"Two surfaces, two audiences" holds: the site is the designer's surface — what Stylos is, what a component is for, how it is used — and the Storybook workshop is the frontend developer's. Publishing the workshop does not merge them; it puts the second surface behind a link on the first.

## 2. The one rule: shown state is derived

The site presents the complete system — the system as designed, not as far as the build has got. Anything that does not exist yet is shown where it will live and marked **Planned**. The mark is never authored per fact: it is computed from the repository at build time, so a project step flips a badge at the next `npm run build` and the site never has to be rewritten to stay honest. A site that must be edited to match reality is a second copy of reality, and second copies drift — the failure the charter names under *one authored rule, many outputs*.

### The derivations

| Shown | Derived from | Flips when |
| --- | --- | --- |
| `npm install @stylos/ui` — Planned | `packages/ui/package.json` `private: true` | the package is published and the flag is removed |
| `registry.json` and the consumer skill — Planned | [`docs/specs/README.md`](README.md) row 0010 not `Built` | SPEC 0010 Part B lands |
| the Storybook link, header and resources | `apps/workshop/storybook-static/index.html` exists | `npm run build:publish` built it |
| the version pill | root `package.json` `version` | every release |
| component / contract / ready / in-code counts | the registry, `builtComponents` | every registry or package change |
| the wave and milestone charts | `PLAN.md` §4.1 and §9 via `tools/lib/plan.mjs` | every plan edit |
| the Figma library links | the table in [`figma/README.md`](../../figma/README.md) | the table is edited |
| the GitHub link | root `package.json` `repository` | — |

`tools/lib/site.mjs` holds these reads and nothing else. Every one is absent-safe: a missing file or table drops the element rather than failing the build or inventing a value, the same posture `readPlan` takes.

## 3. The pages

- **`index.html`** — the front page, rewritten in `tools/build-home.mjs`.

  > **Amended 2026-09-06, owner's review:** the page opens on a **cover**, the way the Figma files do — the brand surface, the wordmark at full size, the capital standing on the panel's bottom edge — and the cover is the only place the wordmark appears: the header's brand slot is off on this page, because two logos on one page was one too many. The live sample of implemented components is withdrawn from the front page (it read as clutter where the pitch belongs); the workshop is the living surface for components, and §5's honesty rule survives as the standing constraint on any future sample anywhere on the site.

  Top to bottom: the cover, with the site's menu on its surface (no rule under it — the panel is the ground) and the panel hanging out of the measure by its own padding so the cover's text sits on the same vertical line as every section below; on it the wordmark, the README lede as the headline, the charter's character line, the version pill, the capital standing whole on the bottom edge, two doors — components and Storybook; then the character cards, authored from [`docs/charter.md`](../charter.md); a quick start (the CSS path as it works today, the npm path marked Planned); the state of the system — the tally (including the derived in-code count), the *working towards* sentence, the wave and milestone charts, unchanged in substance from the placeholder; the resources — GitHub, the four Stylos Figma libraries, the workshop, the package; the shared footer.
- **`registry.html`** and **`components/`** — unchanged in behaviour, redressed: the shared header above each page's own masthead, the shared footer, and the skin aligned with the front page. Every filter, facet, sort, link, and the component pages' print styles survive as they are.
- **`storybook/`** — the built workshop, copied in whole (§6).

The shared chrome is `tools/lib/chrome.mjs`: one header (Home · Components · Registry · Storybook · Figma · GitHub, the current page marked `aria-current`), one footer (provenance: generated date, what is resolved from where), one stylesheet fragment, all rendered per page depth through the same `prefix` the theme already takes. The header carries no script — the component pages assert they have none, and stay right.

## 4. Constraints carried over, and the one new allowance

Everything [SPEC 0002](0002-registry-viewer.md) §4.1 fixed still holds: each page is self-contained, styles and data inlined, nothing fetched to render, the tree works over `file://` and survives being copied or zipped. `tools/` stays dependency-free. No Stylos value is transcribed — every colour, radius and measure on every page is resolved from `tokens/` (or, in the sample, from the token sheet `tools/build-css.mjs` generates) at build time.

**The new allowance is navigation.** A site may link out; a page still may not *load* anything remote. The tests, which asserted zero remote URLs on the home page, now assert an allowlist of exact origins — the Figma design URLs from `figma/README.md`, the GitHub repository from `package.json`, the SVG namespace — and continue to forbid remote scripts, stylesheets, fonts, images and `fetch`. An origin not on the list is still a failure.

**One stated exception:** `storybook/` is an application, not a document — it loads its own scripts and does not work over `file://`. The promise that the *whole tree* opens from disk narrows to: every generated page opens from disk; the workshop subtree requires a server, which the host it is built for is.

## 5. The sample is real or it is absent

> **Amended 2026-09-06, owner's review: the front page carries no sample.** The section below described one and it was built, then withdrawn the same day — components on the pitch page read as clutter, and the workshop is the living surface for them. What survives is the rule, standing, for any sample any page of this site ever carries.
>
> **Amended 2026-09-06, second: the samples' home is the component pages.** Where a component is implemented, its page opens on a live render at the contract's defaults and every value row and example renders real markup from the shipped CSS — [SPEC 0003](0003-component-page.md)'s placeholder slots, filled at last, from code rather than from a Figma export. The rule below governs them; a registry example the contract refuses falls back to the placeholder rather than failing the build, because an example is the contract's to state.

A page of this site renders the implemented components — nothing else. The markup is written to the DOM contract of [SPEC 0010](0010-distribution-surface.md) §2.3 (`stylos-<slug>`, `data-<kebab>` verbatim, text as content), generated from each entry's `api` rather than typed; the CSS is the authored per-component CSS from `packages/ui/src/` plus the token sheet, inlined. A component that is not built does not appear as a picture, a sketch, or a promise — the counts and the charts say what is coming; a sample only ever shows what ships. **Nothing on this site is a mockup.**

## 6. Build integration

- `tools/build-site.mjs` gathers the §2 facts, prepares the sample, and — when `apps/workshop/storybook-static/` exists — copies it to `build/storybook/` after the assets. Absent, it warns and builds the tree without the link; the header derivation keeps the two consistent.
- Root `package.json` gains `"build:publish": "npm run workshop:build && npm run build"` — the order matters only in that `npm run build` empties `build/` first. `npm run build` alone stays the fast loop and produces a correct (workshop-less) tree.
- Nothing new is committed: `build/` and `storybook-static/` were both already gitignored.

## 7. Acceptance

1. `npm run build:publish` produces `build/` with the four surfaces; `npm run build` produces the same tree minus `storybook/`, with no Storybook links.
2. Every §2 derivation is unit-tested, including the absent case.
3. The home allowlist test passes; the registry and component page tests pass unchanged in what they assert about behaviour.
4. The sample honesty rule (§5) is exercised: an implemented component's page renders live previews from the shipped CSS, an unimplemented one keeps its placeholders, and a refused assignment falls back rather than shipping a false claim. *(Amended 2026-09-06 twice: withdrawn with the front-page sample, back the same day when the samples moved to the component pages.)*
5. The tree opens over `file://` (workshop excepted) and over a static server; both colour schemes render; the component pages still print.

## 8. Out of scope

- The Netlify wiring, DNS, and any deploy automation — the owner's act, possibly a later spec if it earns automation.
- A restyle that changes registry or component page *behaviour* — this spec redresses them.
- Search, analytics, comments, or any capability requiring script beyond what the registry view already carries.
- Publishing the workshop anywhere but inside this tree.
