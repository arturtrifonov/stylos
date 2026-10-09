# Typography

Status: Confirmed
Scope: Font sizes, line heights, typeface roles, weights, text spacing, the use of ready-made text styles and spacing between document text blocks; what the words say is [content/](../content/README.md).

Canonical component size names follow FND-NAMING-11. A text style combines a typeface role, a measure, a line-height family, a weight role and text spacing for a particular use.

## Size and measure

### FND-TYPOGRAPHY-01 — Font size and line height share a measure key

**MUST.** Use font size and line height tokens with the same measure key.

Why: each font size and its line height were authored as a pair; mixing keys takes the size from one pair and the leading from another.

A measure is the shared key, such as `1_000`, in `font/size/1_000` and `font/line height/text/1_000`. It identifies a pair, not equal numeric values. FND-TYPOGRAPHY-02 selects the line-height family.

### FND-TYPOGRAPHY-02 — The line-height family follows the text role

**MUST.** Choose the line-height family for the text role: `heading` for headings, `code` for code, `string` for other single-line content and `text` for other wrapping content.

Why: headings, code, compact lines and paragraphs have different leading needs, even when they share a font size.

The heading and code roles take their own families whether they use one line or several. For other content, labels, buttons, tabs and compact values use `string` when their contract keeps them on one line; descriptions and messages use `text` when they can wrap. A wrapping role still uses `text` when its current content happens to fit on one line.

These are line-height family names, independent of the public property kinds `text` and `string` described in the [registry guide](../components/registry/README.md).

### FND-TYPOGRAPHY-03 — Measure names are ratios to the font-size base

**MUST.** Name each measure as a ratio to the font-size base, identified by `font/size/1_000`.

Why: ratio names describe the relation to the base rather than an absolute measurement, following PRN-02.

`1_000` is one base and `1_500` is one and a half. The font-size base is separate from the spacing base: FND-SPACING-01 uses the same ratio notation, not the same base value. The base and supported sizes live in [`tokens/font.yaml`](../../tokens/font.yaml); `npm run tokens:report font` prints their resolved values.

The ratio names the font size. The matching line heights are authored for each family, rather than calculated by applying that ratio to the font-size base.

Serves: PRN-02.

## Typeface roles

### FND-TYPOGRAPHY-04 — Typeface tokens identify roles

**MUST.** Select `font/family/normal` for text and string roles, `font/family/display` for headings and `font/family/code` for code.

Why: a role explains why a typeface is used and remains meaningful when its value changes.

`normal` and `display` remain separate roles even when they use the same typeface. Line-height families and typeface roles serve different purposes: both `text` and `string` use the normal typeface role, with their own line-height families.

Serves: PRN-04.

### FND-TYPOGRAPHY-05 — Weight uses shared roles

**MUST.** Use `font/weight/base`, `font/weight/emphasis` or `font/weight/strong` for typography weight.

Why: shared roles keep the levels of emphasis consistent across components and styles.

`base` is the ordinary weight, `emphasis` adds emphasis and `strong` provides the strongest of the three roles. Styling the system can change these tokens' numeric values, including intermediate weights supported by a variable font. Components and text styles continue to reference the shared tokens; styling does not permit arbitrary local weights.

A replacement typeface needs to support the chosen role weights so the three levels of emphasis remain distinct.

### FND-TYPOGRAPHY-06 — Default typefaces support English

**MUST.** Use Georama for the normal and display roles and JetBrains Mono for code in the default system.

Why: these defaults give ordinary text, headings and code a consistent typeface choice across the system.

The default system supports English. Support for other languages depends on the families selected when styling the system.

Exception: **System typeface replacement.** A system theme may replace the family token values with typefaces that support its required languages; typography continues to use the role tokens and paired measures defined by FND-TYPOGRAPHY-01, FND-TYPOGRAPHY-04 and FND-TYPOGRAPHY-05.

## Recommended size-to-measure profiles

### FND-TYPOGRAPHY-07 — Element and Object profiles are starting points

**MAY.** Use the following size-to-measure profiles as a starting point for Element and Object typography.

Why: a shared starting point helps components fit together, while leaving room for their different text roles and proportions.

| Size | Element measure | Object measure |
| --- | --- | --- |
| `extra small` | `0_750` | `0_875` |
| `small` | `0_875` | `1_125` |
| `medium` | `1_000` | `1_375` |
| `large` | `1_250` | `1_625` |
| `extra large` | `1_500` | `1_875` |

These are recommendations, not required mappings. A component's contract records its actual mappings for its text roles. Those roles can change together at different rates, as Label's name and supporting text do.

## Text spacing

### FND-TYPOGRAPHY-08 — Tracking follows the text style's case

**MUST.** Use `font/letter spacing/style/uppercase` for uppercase text styles and `font/letter spacing/style/normal` for other text styles.

Why: uppercase styles need their own tracking, while ordinary styles use no added tracking.

The text style determines the choice. An acronym or user-entered value written in capitals does not by itself turn an ordinary text style into an uppercase style.

Paragraph spacing is a separate part of a wrapping text style, expressed through `font/paragraph spacing` tokens. It describes the distance between paragraphs, rather than letter spacing or line height.

## Heading width

### FND-TYPOGRAPHY-09 — Headings use normal font width

**MUST.** Render heading text styles at the selected typeface's normal width.

Why: the heading hierarchy is defined by its typeface role, measure and weight, without an additional width adjustment.

## Applying text styles

### FND-TYPOGRAPHY-10 — Content uses ready-made text styles

**MUST.** Apply a ready-made text style to ordinary content rather than choosing its font tokens separately.

Why: a complete style keeps typography consistent across pages.

This applies to page headings, paragraphs, lists and Markdown output. Classes, wrappers and document containers select existing styles such as `text/base/medium` and `heading/h2`.

Exception: **Component implementation.** Components may combine font tokens for text roles defined in their contracts; FND-TYPOGRAPHY-01, FND-TYPOGRAPHY-02, FND-TYPOGRAPHY-04, FND-TYPOGRAPHY-05 and FND-TYPOGRAPHY-08 still apply. Content wrappers and document containers select complete styles.

[Figma representation](../../figma/typography.md) · [HTML integration](../../packages/ui/README.md#content-typography).

## Document spacing

Approved by the owner on 2026-10-09: [Figma reference, option B](https://www.figma.com/design/2OJYDoTE9EAdQKaJAJK9Kt/Stylos--Styles?node-id=2777-42).

### FND-TYPOGRAPHY-11 — Heading spacing follows its level

**MUST.** Use the following gap-token profile before and after headings in document content.

Why: larger sections need more separation, while headings stay close to their text.

| Heading style | Before | After |
| --- | --- | --- |
| `heading/h1`, `heading/h2` | `dimension/gap/g-3_500` | `dimension/gap/g-1_500` |
| `heading/h3`, `heading/h4` | `dimension/gap/g-3_000` | `dimension/gap/g-1_000` |
| `heading/h5`, `heading/h6` | `dimension/gap/g-2_000` | `dimension/gap/g-1_000` |

Gaps are measured between text blocks' line-box bounds, separately from line height. They stay the same when a heading wraps or the body text size changes. FND-TYPOGRAPHY-12 determines the resulting gaps.

Checked by: `npm test` and the workshop's `Foundations/Typography` play checks.

### FND-TYPOGRAPHY-12 — Adjacent document gaps collapse

**MUST.** Use the larger of the preceding block's after-gap and the following block's before-gap as the single gap between adjacent document text blocks.

Why: adding both gaps creates excessive space around headings.

For paragraphs and headings, use `max(previous.after, next.before)`. Remove the outside gap before the first block and after the last block. Container padding is separate and follows FND-SPACING-02.

Checked by: the workshop's `Foundations/Typography` play checks.

### FND-TYPOGRAPHY-13 — Paragraph gaps come from the selected style

**MUST.** Use the selected ready-made body text style's paragraph spacing as a paragraph's after-gap, with no before-gap.

Why: each text style already defines its paragraph rhythm.

The gap uses the style's `font/paragraph spacing` token and follows FND-TYPOGRAPHY-12. In Figma, use native paragraph spacing within a text layer or one gap between separate layers; applying both would double the interval.

Checked by: the workshop's `Foundations/Typography` play checks across all five base body sizes.
