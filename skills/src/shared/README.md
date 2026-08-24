# skills/src/shared/

Rules referenced by more than one skill, defined once and pulled in rather than copy-pasted across `SKILL.md` files.

Empty for now. Candidates worth extracting once a second skill needs the same rule verbatim:

- The canonical size values (`extra small`…`extra large`) and their abbreviation mapping — currently only `naming-cleanup` uses them.
- The controlled-property-group ordering rules ([naming.md](../../../docs/foundations/naming.md) §9).
- Severity vocabulary (`Error:`/`Warning:`/`Info:`) used by `component-integrity-check` and potentially future audit-style skills.

Don't extract something here speculatively — wait until a second skill actually needs it, per the project's own bias against premature abstraction. The build tool (`tools/build-skills.mjs`) does not currently resolve imports from this directory; that's a TODO for whenever the first shared rule is added.
