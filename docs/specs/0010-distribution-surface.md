# SPEC 0010 — The distribution surface

**Status:** Open — written 2026-09-06
**Date:** 2026-09-06

A work order for everything `@stylos/ui` hands to a consumer. [SPEC 0009](0009-stylos-ui-package.md) builds the package; this says what leaves it, in what form, and who reads each thing. The boundary between the two is exact: **0009 owns `src/`, 0010 owns `exports` and `dist/`.** Where this spec needs a change inside the package, it is named as an amendment to 0009 rather than restated.

The gate it serves is `0.3.0` requirement 2 ([`PLAN.md`](../../PLAN.md) §1): *the code half of the proof screen is built by an agent from the published artifacts alone, without access to this repository.* Every decision below is answerable to that one sentence — an artifact that does not help an agent get the screen right, or that an agent cannot find without being told, does not belong here.

---

## 1. Two parts, two releases

| Part | Contents | Release |
| --- | --- | --- |
| **A — the code surface** | the `exports` map, the independent CSS export | `0.2.0`, alongside [SPEC 0009](0009-stylos-ui-package.md) |
| **B — the agent and design surface** | `registry.json` and the per-component contracts, the consumer skill, the design-system bundle, the exported lint config | `0.3.0` |

Part A can land while the package is still three components deep; it costs a build step and an `exports` field. Part B needs enough of the core set implemented to be worth reading, and is Stage 6 work.

---

## 2. Part A — the code surface

> **Amended 2026-09-06 (second): `./text.css` joins the map.** The Figma text styles were recorded nowhere — Styles have no Variables export, so `tokens:import` never saw them. They are now read over the Plugin API and recorded in `figma/text-styles.yaml` as aliases into `tokens/` (`tools/import-styles.mjs`), then projected by `tools/build-text-css.mjs` onto one class per style, every declaration a `var()` into `tokens.css`. Elevation needed no new record: the effect styles follow `docs/foundations/effects.md`'s composition rule exactly, and `--stylos-shadow-elevation-1…6` already carry it. The avatar paint styles are image fills, exported once at 256×256 to `assets/avatars/`; they will enter the package when the Avatar component slice needs them.
>
> **Amended 2026-09-06: `./fonts.css` joins the map.** Discovered mounting the first component in the workshop: `tokens.css` names Georama and JetBrains Mono but nothing in the package supplied them, so every consumer fell back to the system stack. The package that names the families ships the faces — `tools/build-ui-fonts.mjs` copies the committed subsets from `assets/fonts/` to `dist/assets/fonts/` and writes `dist/fonts.css` with the `@font-face` rules, rendered by the same `fontFacesCss` the registry-viewer pages use, so the two cannot drift. Copied, never fetched at build: a font update is a deliberate commit with a diff, not a side effect of a build. A separate file from `tokens.css` deliberately — a client theme with its own brand face links its own faces and skips this export.

### 2.1 The exports map

`packages/ui/package.json` today exports `.` and `./tokens.css`. Target:

```json
"exports": {
  ".":                { "svelte": "./src/index.ts" },
  "./tokens.css":     "./dist/tokens.css",
  "./fonts.css":      "./dist/fonts.css",
  "./text.css":       "./dist/text.css",
  "./tokens.json":    "./dist/tokens.json",
  "./css":            "./dist/css/stylos.css",
  "./css/*.css":      "./dist/css/*.css",
  "./registry.json":  "./dist/registry.json",
  "./registry/*.json":"./dist/registry/*.json",
  "./stylelint":      "./stylelint.config.js",
  "./skill":          "./skill/SKILL.md",
  "./package.json":   "./package.json"
}
```

Every path under `dist/` is generated and gitignored; `stylelint.config.js` and `skill/` are authored and committed.

### 2.2 The CSS export

**Per component and in aggregate, both.** A preview and a small page want one file; an application wants only what it uses, and a 39-component stylesheet on a dense screen is not free.

- `tools/build-ui-css.mjs` copies each `src/components/<name>/<name>.css` to `dist/css/<name>.css` unchanged, and concatenates all of them, in registry order, into `dist/css/stylos.css` with a generated header naming the version and the components inside.
- **Neither file contains `tokens.css`.** A consumer links tokens separately, because that is the file a client theme overrides. Bundling them would make the override a cascade fight.
- No transform, no minification, no autoprefixing. It is a copy, in the same sense `tokens:css` is a projection: a build that improved a value on the way through would be a second source of it.
- Runs in `prebuild`, after `tokens:css` and the SPEC 0009 generators.

### 2.3 The DOM contract

Part A is what makes a Stylos component usable without Svelte, so the mapping from contract to markup stops being an internal convention and becomes public:

| From | To |
| --- | --- |
| the entry's `id` | class `stylos-<slug>`, the slug being the same one the registry path uses |
| an `api` variant or boolean property | `data-<kebab-name>`, value verbatim from `api` |
| an `api` `text` or `slot` property | element content |

This is what `Badge.svelte` already writes. Stating it here makes an agent's hand-written HTML and the Svelte wrapper's output the same string, which is requirement 1 of §5.

---

## 3. Part B — `registry.json`

### 3.1 Two files, not one

The full contracts of 114 entries are far more than an agent should read to pick one component, and reading them all is how the context gets spent before any code is written. So:

- **`dist/registry.json`** — the index. One object per entry: `id`, `slug`, `level`, `role`, `family`, `summary`, the first `use_when`, the first `do_not_use_when`, `implemented`, and `class`. Nothing else.
- **`dist/registry/<slug>.json`** — the whole contract for one entry, projected from its YAML: `api` with every property's values and `description`, `use_when` and `do_not_use_when` in full, `limitations`, `sizing_model`, `a11y`, `html`, `relations`, `figma`.

The address is derived, never searched: a component named in the index is read at `@stylos/ui/registry/<slug>.json`. That is the same rule the Figma agent already runs on (`figma/mcp-and-connectors.md`), and it has no failure mode that a search has.

### 3.2 `implemented` is derived

An entry is `implemented: true` when `packages/ui/src/components/<slug>/` exists **and** `src/index.ts` exports it. Derived at build time, never authored — the same discipline as `documented` and `linked` in the registry view, and for the same reason: a flag someone has to remember to set is a flag that is wrong.

**The index carries all 114 entries, with the unimplemented marked.** Omitting them would leave an agent unable to tell "this system has no date picker" from "I did not find one", and the second reading ends in an invented component. The skill (§4) states the rule that `implemented: false` means it does not exist.

### 3.3 Generator

`tools/build-registry-json.mjs`, using the restricted-YAML reader already in `tools/lib/`, covered by `tools/**/*.test.mjs`. It fails rather than warns on an entry whose `api` names a property the component's directory does not write as a data attribute — the same 1:1 check the compiler does for Svelte props, applied to the plain-HTML path.

---

## 4. Part B — the consumer skill

`packages/ui/skill/SKILL.md`, authored once, committed, exported as `@stylos/ui/skill`. What it contains:

1. What Stylos is, in three sentences, and what it is not for.
2. **The address rule** — the index at `@stylos/ui/registry.json`, one contract at `@stylos/ui/registry/<slug>.json`.
3. **The existence rule** — only `implemented: true` may be used; anything else does not exist, and the correct response to "no component fits" is to say so, not to build one.
4. **How to render** — the Svelte import, and the class-plus-data-attributes form of §2.3 for every other stack.
5. **The value rule** — colour, size and spacing come from `tokens.css` custom properties; a literal is a defect, not a shortcut.
6. **How to verify** — install the exported Stylelint config, run it, and what each failure means.

**The skill names no component.** A list inside it is a copy of the index, and it drifts the first time a component lands. It says where the list is.

It is prose, not a generated document, because it states rules rather than data — the same split as `docs/foundations/` against `tokens/`.

---

## 5. Part B — the design-system bundle

For Claude Design, whose design-system projects are files, and whose Design System pane builds its card index from each preview's first-line `<!-- @dsCard group="…" -->` marker.

### 5.1 Shape

```
dist/design-system/
  tokens.css                        copied
  css/<slug>.css                    copied
  components/<slug>/index.html      one card per component
  foundations/colour.html           the semantic roles, both modes
  foundations/type.html             the type scale
  foundations/spacing.html          the spacing and size scales
```

A component card:

```html
<!-- @dsCard group="Element" -->
<link rel="stylesheet" href="../../tokens.css">
<link rel="stylesheet" href="../../css/badge.css">
<section class="preview">
  <!-- one instance per documented value of each api property -->
</section>
```

`group` is the entry's `level`. It is filled on all 114 entries, so nothing is authored to group them.

### 5.2 Generator

`tools/build-previews.mjs`, from `registry/*.yaml` and the component CSS. The instances come from `api` and `sizing_model` — the same two fields `build-ui-stories.mjs` reads, which is the check that the two surfaces show the same set.

The three foundation cards are generated from `tokens.json`, not authored.

### 5.3 States, and the one amendment to SPEC 0009

A preview is static: no Zag machine runs in it, and `:hover`, `:focus-visible` and `:active` cannot be photographed. A card that silently omits them shows a component the design tool will then use without ever seeing its states.

**Amendment to [SPEC 0009](0009-stylos-ui-package.md) §2, layer 2:** where a component's CSS styles a pseudo-class, the rule is authored as a selector list carrying a forcing hook beside it.

```css
.stylos-button:hover,
.stylos-button[data-force="hover"] { … }
```

One authored place, no value written twice, and the hook is inert in a real application because nothing writes that attribute. The alternative — a `preview.css` restating the same declarations — is a second copy of every interactive rule, which is the failure this system has corrected more than once.

### 5.4 Syncing

The bundle is a build output; putting it into a Claude Design project is an agent's session task, not a script, because the transport is an MCP tool. The procedure, documented alongside the generator: read the project's file list, plan the writes, then write — **one component at a time, as each preview lands, never as a wholesale replace.**

---

## 6. Part B — the exported lint config

`packages/ui/stylelint.config.js` exists for the package's own source ([SPEC 0009](0009-stylos-ui-package.md) §6). Exporting it for a consumer requires one change: **no path in it may assume this repository.** The `tokens.css` exception is expressed as a file-name pattern, not as `packages/ui/dist/tokens.css`, so a consumer extending the config gets the same three rules — no hex, no raw `px`, colour and size and spacing through `var()` — over their own tree.

---

## 7. Acceptance

- A scratch project outside this repository, with `@stylos/ui` as its only dependency, resolves every path in §2.1 and renders a component from `./css` and the DOM contract of §2.3 with no Svelte.
- `dist/registry.json` lists all 114 entries and marks exactly the implemented ones; every `implemented: true` entry has a contract file that resolves; `build-registry-json` fails on an `api` property the component does not write.
- Every generated preview renders, and every interactive component's card shows its states through the §5.3 hook.
- The skill contains no component list and no value that also lives in the registry.
- The exported Stylelint config runs clean over the package and fails a hex, a raw `px` and a literal colour in a consumer tree.
- **The gate:** an agent given only the published artifacts builds the code half of the proof screen. Every question it could not answer from them is logged; that log is `0.3.1` input ([`PLAN.md`](../../PLAN.md) §4.3).

---

## 8. Out of scope

- **Code Connect.** It needs a paid Figma plan, and it serves the Figma-to-code path rather than this gate. Its files are generated from `api` and `figma.node_id` when it arrives; alpha ([`PLAN.md`](../../PLAN.md) §2).
- **The distribution channel and the licence.** The package stays `private` and is consumed as a git dependency. Nothing in this spec changes when the channel does — which is the reason to specify the artifacts now and the channel later.
- **Framework adapters.** The layering allows one; nothing asks for one.
- ~~**A published documentation site.** The generated pages and the workshop stay local.~~ *Amended 2026-09-06: superseded by [SPEC 0011](0011-project-website.md) — the generated pages are the site, and the built workshop is published inside its tree.*

---

## 9. Documents corrected with the work

Per the definition of done ([`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7), in the same pull request as the change that earns each:

- **`ARCHITECTURE.md` §3** gains a row per artifact as it is built, and the matching row leaves [`PLAN.md`](../../PLAN.md) §2. §2.2's component diagram gains the two new outputs; §4's *published documentation does not exist* stays true and is not touched by any of this.
- **The third audience.** `docs/charter.md` §"Two audiences" named the repository's audience as the owner and Figma's as whoever designs with Stylos. A coding agent reading `registry.json` is a third, and it is the one this spec is built for. One paragraph, in the pull request that lands Part B. *Amended 2026-09-09: that charter section was removed when the charter was cut back to purpose, character and boundaries. The paragraph is still owed; where it is written is settled with Part B, since the charter no longer has the section it was to be added to.*
- **[SPEC 0009](0009-stylos-ui-package.md) §2** takes the §5.3 amendment.
- **`docs/specs/README.md`** — this row, and 0009's when it closes.
- **`CHANGELOG.md`** — an `## [Unreleased]` entry per part.
