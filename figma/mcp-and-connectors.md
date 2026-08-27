# Figma MCP and the GitHub connector — what actually works

Verified on `Stylos / Components` (`WUc07ZBtjRvypXtsOlbVut`), 2026-08-26, against the
live Checkbox page. Everything marked **verified** was executed and its result read
back. Everything else is labelled.

## Reading

| Capability | Tool | Verified |
| --- | --- | --- |
| List pages of a file | `get_metadata` (no `nodeId`) | yes — 58 pages returned |
| Component sets, variants, property definitions, defaults, variant options, property order | `use_figma` → `componentPropertyDefinitions` | yes |
| Default variant of a set | `use_figma` → `set.defaultVariant` | yes |
| Full layer tree, variable bindings per node, instance→main-component links | `use_figma` traversal | yes |
| Component `description` and `descriptionMarkdown` | `use_figma` | yes |
| `documentationLinks` | `use_figma` | yes |
| Search the published library by name, with descriptions | `search_design_system` | yes — returns `componentKey`, **not** a node id |
| Resolve a published component by key, including one no longer on canvas | `importComponentSetByKeyAsync` | yes |
| Screenshot of a node | `get_screenshot`, or `await node.screenshot()` inside `use_figma` | not exercised this session |
| Variable definitions for a node | `get_variable_defs` | not exercised this session |

Notes that cost time to learn:

- `search_design_system` covers the **published** library and returns component keys.
  `use_figma` covers the **canvas** and returns node ids. They are different sets, and
  the gap between them is diagnostic: a component in one and not the other is a
  library-hygiene defect.
- `figma.currentPage` resets between `use_figma` calls, and one script may call
  `setCurrentPageAsync` only once. Multi-page work is separate parallel calls.
- `findAllWithCriteria` only sees loaded pages. There is no supported whole-file
  component search from `use_figma`; `search_design_system` is the substitute, and it
  only sees what is published.

## Writing descriptions

All verified by round-trip on `Checkbox Input` (`4349:1753`) and its default variant,
restored to the original text in the same call.

| Target | Writable | Behaviour |
| --- | --- | --- |
| `set.descriptionMarkdown` | yes | Markdown preserved — bold, lists, links all survived. Writing it also populates `description` with a flattened plain-text copy. |
| `set.description` | yes | **Destructive: sets `descriptionMarkdown` to empty.** Never write this field. |
| `variant.description` / `variant.descriptionMarkdown` | yes | Same behaviour, per individual variant component. |
| `set.documentationLinks` | yes | Accepts `[{ uri }]`. |

**The operative rule: always write `descriptionMarkdown`, never `description`.**
Anything that writes `description` silently discards formatting, and the loss is not
visible until someone opens the Assets panel.

Not verified: whether an updated description reaches library consumers without a
library publish. Assume it does not.

## Version history

Owner's observation, 2026-08-26: MCP writes are workable but pollute the file's
version history. This is the reason the MCP is not the default route for description
transfer, even though it is capable of it.

Two writes were made to `Checkbox Input` during the capability probe above and
reverted in the same call; the text is unchanged but the history entries exist.

## The GitHub connector

`https://github.com/wrgraff/stylos.git` is connected to Figma as an MCP connector for
the Figma agent. Owner's finding, 2026-08-26: it works, and the agent locates specific
files in the repository reliably.

What follows from that:

- **The repository can be the source the Figma agent reads from directly.** Component
  descriptions do not need to be generated as a block and pasted into chat. The agent
  is pointed at a file and a heading.
- **Skills can treat the repository as their data source** — foundations, naming rules,
  the registry, token reports — instead of carrying copies that go stale.

Two constraints that come with it:

- **It reads GitHub, not the working tree.** Anything unpushed does not exist to the
  Figma agent. Push discipline stops being a habit and becomes part of the mechanism.
- **It needs a deterministic address, not a search.** "Find the description for
  Checkbox Input" is a retrieval problem with a failure mode. "Read
  `docs/components/registry/checkbox-input.yaml`, and compose the description from
  `summary`, the first `use_when` and the first `do_not_use_when`" is not. The path
  follows from the component's `id` by a stated rule, and the three lines are fields
  rather than a section a heading has to locate
  ([`registry/README.md`](../docs/components/registry/README.md)).
