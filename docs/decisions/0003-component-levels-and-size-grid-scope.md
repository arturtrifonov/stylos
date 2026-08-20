# 0003 — Component levels and size-grid scope

**Status:** Accepted
**Date:** 2026-08-20

## Problem

The master document confirms typography/size profiles for two architectural levels, Element and Object (§11.4–§11.5), and leaves everything else open: "*the library may also contain lower-level primitives and higher-level compositions, but their typography profiles are not yet defined*" ([§14.1](../master-document.md#141-component-levels)), tracked as [§27 item 11](../master-document.md#27-open-decisions).

The Airtable component registry (95 components, imported 2026-08-20) uses a five-value **Content Category** column — Primitive, Element, Object, Widget, Layout — with real data behind every row. That raised a question worth answering explicitly rather than assuming: should the size grid (and the `stylos-text-sizing` skill built on it) eventually cover all five levels, or is Element/Object-only permanent?

## Decision

**The five-level taxonomy is confirmed as the component-level model.** It doesn't replace or contradict the master document's Element/Object framing — it fills in exactly the gap §14.1 already flagged as unresolved.

| Level | Size grid | Rationale |
| --- | --- | --- |
| **Primitive** | Preferred sizes only, not a skill-enforced grid | e.g. Icon, Badge, Indicator, Loader. No audience/gap system comparable to Element/Object exists at this level. |
| **Element** | Confirmed shared grid ([§11.4](../master-document.md#114-element-text-profile)) | Compact controls (Checkbox, Chips, Link, Radio, Toggle…). Structurally similar enough across the set that a shared grid produces a good draft — height and fixed-component width patterns hold across the level, even where padding differs slightly (e.g. Input vs. Button). |
| **Object** | Confirmed shared grid ([§11.5](../master-document.md#115-object-text-profile)) | Larger content-rich components (Button Basic, Input Text, Select, Table cells…). Same reasoning as Element: enough shared structure for one grid, with the same caveat that some components need small manual tweaks after applying it. |
| **Widget** | **No shared grid — by design, permanently** | Widgets vary too much in size to encode a rule. Breadcrumbs (small gaps between links, no padding) and Alert (large buttons) share nothing size-wise. There is no ground rule to extract, and a size skill for this level is not a gap to fill later — it's architecturally impossible, because the skill has no way to know what kind of widget it's looking at (modal-sized vs. inline-sized). |
| **Layout** | No shared grid | Even more context-dependent than Widget (Bottom Sheet, Header, Modal, Side Panel…). Same reasoning applies. |

## Why this matters for skills specifically

Master doc [§1](../master-document.md#1-document-status-and-terminology) and [§18](../master-document.md#18-figma-agent-skill-system) are already explicit that a skill is a narrow operational tool, not documentation. This decision is that principle applied to `stylos-text-sizing`: its scope (Element and Object only) is not an unfinished feature — it's the boundary of what a shared, mechanically-applied grid can honestly claim to do. The skill exists to produce a **consistent draft** for Element/Object components, close enough that only small manual tweaks remain. Trying to extend it to Widget or Layout wouldn't produce a worse draft — it would produce a meaningless one, because there is no shared pattern underneath for the skill to apply.

Widget- and layout-level components still need documented sizing — it just has to be recorded per-component in `docs/components/<name>.md`, not derived from a shared foundation. That's expected, not a documentation gap.

## Consequences

- `docs/foundations/sizing.md` and `docs/foundations/typography.md` are updated to state Widget/Layout have no shared grid as a **confirmed, permanent** fact, not an open TODO.
- Master doc [§14.1](../master-document.md#141-component-levels) and [§27 item 11](../master-document.md#27-open-decisions) should be updated to reflect this the next time the master document itself is edited: item 11 can be closed for Widget/Layout (never will have a profile) and narrowed to just Primitive (soft "preferred sizes," not yet written down anywhere).
- The component registry's five-level taxonomy is the correct source for a component's architectural level going forward — see [docs/components/README.md](../components/README.md) once the registry is imported.

## Correction to prior guidance

The previous message in this session (proposing to import the CSV registry) suggested the five-level taxonomy should "supersede" the master document's level model, the same way `naming-cleanup` v0.7 superseded v0.5. That framing was wrong — there was no live conflict, only an open gap the master document had already acknowledged. This record resolves the gap; it does not overrule anything the master document currently asserts.
