# SPEC 0012 — The icon system

**Status:** Open — written 2026-09-07
**Date:** 2026-09-07

A work order for the icon set and the component that renders it. The rules it implements are [`docs/foundations/icons.md`](../foundations/icons.md) — what the set is drawn from, at which instance, and the accessibility contract. This spec says what gets built; where the two disagree, `icons.md` wins and this is corrected.

> **Amended 2026-09-07, twice, in the sessions that built the thing. Both amendments removed machinery rather than adding it, and what follows is the result rather than the original.**
>
> **`<Icon name>` takes a Material Symbols name**, not a Stylos meaning slug. One door over the library beat a second vocabulary covering twenty-nine of 3,905 names.
>
> **There is no substitution layer.** The first draft translated Figma's thirty system components into code as a provider, a replaceable `IconSet` and a client-side set generator. That was the wrong translation, and the reason is §1: the indirection exists in Figma because a designer picks visually out of a connected library, and a developer does not — a developer adds the icon they need to the manifest. Removed: the provider, the client generator, the second package carrying all 3,905, and the `IconSet` type they shared.

---

## 1. What the Figma model decided, and what does not carry over

The Figma library solved the set problem first:

1. The library needs icons; drawing a set is not affordable in Alpha; so a good free set is adapted and pre-configured. That is Material.
2. The marks components use are **pulled out into the main library as thirty separate components** — twenty-nine plus a placeholder ([node `2839:2469`](https://www.figma.com/design/WUc07ZBtjRvypXtsOlbVut/Stylos--Components?node-id=2839-2469)).
3. Every icon slot points at one of those thirty, so connecting a different library and replacing the thirty carries every component with it.
4. The full published Material library stays connected, so any slot can be swapped to anything in it.

**What carries over is (1) and (2): the set, and which marks are in it.**

**What does not carry over is (3) and (4), and both for the same reason.** They answer a question about *picking*. A designer works by browsing a connected library and swapping instances by eye, so the library has to be present and the swap has to reach everywhere at once. A developer does not browse; they write the name of the icon they want, and if the set does not have it the fix is a line in the manifest and a regenerated file — not a mechanism.

Translating (3) into a runtime provider would have bought a replaceability nobody asked for and charged for it in every component, each resolving its marks through a context instead of naming them. Translating (4) into a shipped 4.8 MB library would have bought browsing that nothing in a code editor does.

**`api.name` in [`icon.yaml`](../components/registry/icon.yaml) is read here as the record of which marks exist**, not as a prop signature — it described the Figma mechanism. It is corrected by this spec.

---

## 2. The set

Twenty-nine marks, read from the Figma node above. Each is mapped to one Material Symbols name, verified against the 3,905 names in the pinned `material-symbols` package. **Names were checked against the drawings, not inferred from the words** — `File` is a paperclip, `More` is horizontal, and `Expand More`/`Expand Less` do not exist under those names in Symbols at all.

| Figma component | Material Symbols |
| --- | --- |
| Add | `add` |
| Arrow Down | `arrow_downward` |
| Arrow Left | `arrow_back` |
| Arrow Right | `arrow_forward` |
| Arrow Up | `arrow_upward` |
| Calendar | `calendar_month` |
| Check | `check` |
| Chevron Left | `chevron_left` |
| Chevron Right | `chevron_right` |
| Close | `close` |
| Copy | `content_copy` |
| Dash | `remove` |
| Drop Down | `arrow_drop_down` |
| Drop Left | `arrow_left` |
| Drop Right | `arrow_right` |
| Drop Up | `arrow_drop_up` |
| Edit | `edit` |
| Error | `error` |
| Expand Less | `keyboard_arrow_up` |
| Expand More | `keyboard_arrow_down` |
| File | `attach_file` |
| Filter | `filter_list` |
| Home | `home` |
| More | `more_horiz` |
| Person | `person` |
| Search | `search` |
| Success | `check_circle` |
| Time | `schedule` |
| Warning | `warning` |

**The placeholder does not cross over.** In Figma it marks an instance nobody has chosen yet — a state a design file has and a program does not. An icon that was not chosen is not written.

**Three of these change appearance.** `Success`, `Warning` and `Error` are outlined in the current Figma set and become filled, because the instance is `FILL 1`. The expected consequence of replacing the source, not a defect.

[`assets/icons/manifest.yaml`](../../assets/icons/manifest.yaml) carries these twenty-nine as a flat list of Material names, and `assets/icons/svg/` is written from it by `npm run icons:import`.

---

## 3. What ships

One artifact. `@stylos/ui` carries the set as data, inlined — twenty-nine drawings, about 32 KB.

`tools/build-ui-icons.mjs` projects `assets/icons/svg/*.svg` into `packages/ui/src/components/icon/icons.ts`:

```ts
type IconDrawing = { viewBox: string; paths: { d: string; fillRule?: "evenodd" }[] };
```

**Data rather than markup**, so the component renders `<path>` elements and nothing anywhere needs `{@html}` — no injection shape, no sanitiser to maintain. **Data rather than a stylesheet**, so a drawing is addressable by name; a CSS mask set would be one blob keyed by selector, which is worse at exactly the thing the component does.

The whole set ships whether a consumer uses one mark or all of them. That is affordable because the set is small, and the set stays small because §5 admits a mark only when something needs it. The two hold each other up: a set stocked ahead of demand would make shipping all of it wrong.

---

## 4. The component

`Icon` renders one mark. The element is the `<svg>` itself, which is what the contract's `html` says, so the footprint is the element and there is no wrapper.

- **`name`** — a Material Symbols name. No default. A name the set does not carry renders nothing: a default would mean a forgotten prop silently drawing a real mark, and something invisibly wrong is worse than something visibly absent.
- **No size and no tone property**, per the contract's limitations. The footprint is `size/s-3_000`, and a parent with a size run of its own sets `--stylos-icon-footprint`. The token is that variable's fallback rather than a declaration on the rule — a declaration would be the element's own and would beat the inherited one, and the footprint would not be adjustable at all.
- **Colour is inherited**, not declared: `fill: currentColor`. The contract binds the mark to a text colour role, and in composition the right role is whichever one the text beside it already carries. It also makes forced-colors mode correct with no special case.
- **Always `aria-hidden="true"` and `focusable="false"`.** Whether the mark needs an accessible name is the parent's question and nothing in the component can answer it — the entry's `requires` finding is the consumer's obligation. This is the rule the component exists to stop 68 parent entries from each re-deciding.

The contract's `name` carries a few `values` as **examples rather than an exhaustive set** — a text property's values document what a value looks like, and they are what the generated story and the component page render, so neither shows an empty box.

---

## 5. Growing the set

A mark enters `manifest.yaml` when something needs it, and never in anticipation. Adding one is a line and `npm run icons:import`; `npm test` fails when the set and the manifest disagree, so the two cannot drift.

This is the whole of what Figma's point (4) becomes here. The full library stays reachable — any of the 3,905 can be drawn at our instance — but reaching it is a commit rather than a runtime capability, and what arrives is a committed file with a readable diff.

---

## 6. Where the boundary runs

| | |
| --- | --- |
| Which marks are in the set | **open** — a line in the manifest |
| The instance: style, `wght`, `FILL`, `GRAD`, `opsz` | **closed** — not a knob |

An exposed instance would mean two Stylos applications with visibly different icon languages. A client who wants a different icon language is replacing the set, which is a fork of the manifest rather than a setting.

---

## 7. What this changes elsewhere

- **[`icon.yaml`](../components/registry/icon.yaml)** — `api.name` moves from `variant` over twenty-nine title-case values to `text` over Material names, and the entry's prose stops describing the Figma indirection as though it were the code contract.
- **[SPEC 0010](0010-distribution-surface.md) §2.1** — nothing. The component and its drawings sit behind the existing `.` export, and no new export path is needed. One of the things dropping the second package bought.
- **[`icons.md`](../foundations/icons.md)** — the Figma library is what moves to match the code set; the three marks that change fill are named there.
- **[`docs/components/registry/README.md`](../components/registry/README.md)** — `values` on a `text` property are examples, not a vocabulary, and the generators read them as such.

---

## 8. Acceptance

1. `assets/icons/svg/` holds one file per manifest name, and `npm test` fails if it disagrees with the manifest.
2. `<Icon name="…">` renders every mark in the set with no consumer configuration and no provider.
3. A name the set does not carry renders nothing, and nothing throws.
4. The footprint is `size/s-3_000` by default and follows `--stylos-icon-footprint` when a parent sets it — measured, not asserted.
5. Colour is inherited from the surrounding text colour.
6. No consumer install pulls `fontkit`, `wawoff2` or `material-symbols`.
7. The generated story and the component page both show real marks rather than an empty box.

## 9. Not in scope

The Figma library swap; a native Stylos icon set; sprite output; multi-colour marks; any runtime substitution mechanism — see the amendment above for why the last is not merely deferred.
