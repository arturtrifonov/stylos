# SPEC 0013 — Guidelines: the file structure and the rules of rules

**Status:** Open
**Date:** 2026-09-09

A work order. The system's rules today are eight foundation documents about the visual language. Everything else a system has to decide — how a control behaves, how a recurring task is solved, how text is written — has no file to live in, and the rules that do exist are prose with no handle: nothing can cite one, and nothing can check that a citation still points at something.

This spec creates the complete set of guideline files, empty where nothing is settled; defines how a rule is written, so that every rule has an ID and every ID can be cited and checked; and migrates the existing foundations to that form. It settles no rule of the design language itself — a file created here says *yet to fill*, and stays that way until a decision fills it.

---

## 1. Why

**Rules need handles.** A contract, a skill, a test or an agent that wants to point at "focus returns to the invoker" today has to quote it, and a quotation drifts the moment the sentence is edited. An ID does not drift. It is the difference between a guideline that is read once and one that is referenced.

**The gaps need a place.** A rule without a file is written wherever the writer happens to be — in a contract's `notes`, in a spec, in a skill — and is then restated when the next writer does not find it. An empty file with a scope line is a place; a place that says *yet to fill* is a true statement about the system, where silence is not.

**Prose cannot be checked.** `STANDARD.md` withdrew the per-component Markdown template for exactly this reason, and moved prose into fields. Guidelines carry more reasoning than a contract, so they stay Markdown — but with a fixed grammar for the rule block, an ID is extractable, uniqueness is checkable, and a dangling citation fails a build instead of surviving unnoticed.

## 2. Scope

### In scope

- `docs/RULES.md` — the rules of rules: the ID scheme, the rule block, levels, precedence, lifecycle, file header and status.
- Four guideline directories with every file named in §4, each carrying a header and a scope line; a `README.md` index per directory.
- Migration of the eight existing foundations, `docs/components/STANDARD.md`, and the editorial rules in `docs/README.md` to the rule-block form.
- Relocation of the four entries currently under `docs/charter.md` §Principles (§6).
- `npm run validate:rules` and its place in the definition of done.
- The documents that describe the above: `ARCHITECTURE.md` §1, §6, §7; `CLAUDE.md`; `docs/README.md`.

### Out of scope

- **The content of any rule.** No file created here is filled by this spec. Filling is per-topic work, sequenced in `PLAN.md`.
- **`docs/charter.md` §Principles as a text.** The section is reserved for design principles (§6); what they say is settled separately.
- **`docs/components/registry/README.md`.** It documents a data schema, not a guideline; it stays as it is.
- **Skills and contracts citing rules by ID.** Made possible here; done where each is next edited.
- **Rendering guidelines on the site** ([SPEC 0011](0011-project-website.md)). The grammar makes it possible; nothing here builds it.

## 3. The rules of rules — `docs/RULES.md`

The document is normative, in the position `STANDARD.md` holds for contracts. What it must contain:

### 3.1 The ID

`AREA-TOPIC-NN`, and nothing else is a rule.

| Part | Is | Example |
| --- | --- | --- |
| `AREA` | one of `PRN` `FND` `BEH` `PAT` `CNT` `STD` `RUL` | `BEH` |
| `TOPIC` | the file's stem, upper-cased, hyphens kept | `focus.md` → `FOCUS` |
| `NN` | two digits, zero-padded, unique within the file | `03` |

`PRN` is `docs/charter.md` §Principles and has no topic segment: `PRN-01`. `RUL` is `RULES.md` itself: `RUL-01`. `STD` is `STANDARD.md`: `STD-01`.

The topic is derived from the path so the validator can check it, and so a reader knows where a rule lives from its ID alone. Grammar: `^(PRN|RUL|STD)-\d{2}$|^(FND|BEH|PAT|CNT)-[A-Z]+(-[A-Z]+)*-\d{2}$`.

### 3.2 The rule block

A rule is a level-3 heading whose text begins with an ID, and everything under it up to the next heading of level 3 or higher.

```markdown
### BEH-FOCUS-03 — Focus returns to the invoker

**MUST.** When an overlay closes, focus returns to the element that opened it.

Why: a reader who loses their place after a dialog has to find it again by hand; a screen-reader user has to find it blind.

Exception: an overlay that navigated away (a wizard that finished) places focus on the new page's first heading — BEH-FOCUS-05.
Checked by: `@stylos/ui` tests, per component.
Serves: PRN-02.
```

| Line | Required | Form |
| --- | --- | --- |
| heading | yes | `### <ID> — <title>`; the title restates the rule in a few words, it is not the rule |
| statement | yes | the first paragraph; opens with the level in bold; one sentence, imperative, about one decision |
| `Why:` | yes | one paragraph; the reasoning, inline, as every foundation already does |
| `Exception:` | when one exists | one per line; named, and the size of the case it covers |
| `Checked by:` | when a check exists | the command, test or skill; absent means review |
| `Serves:` | optional | the principle IDs the rule follows from |

The body between the statement and the labelled lines may hold what the rule needs — a table, a list, a paragraph of explanation. `naming.md` §8 and §10 are rules whose body is a list; that is allowed, and the statement above the list is still one sentence.

### 3.3 Levels

Three, in the RFC 2119 sense, and the word is the first thing in the statement:

| Level | Means |
| --- | --- |
| **MUST** | a violation is a defect; a build or a review that finds one does not pass |
| **SHOULD** | the default; departing from it needs a stated reason at the point of departure |
| **MAY** | permitted; stated because someone would otherwise assume it was not |

A MUST needs a plausible violator. A prohibition nobody would break is not written.

### 3.4 What is not a rule

- **Prose.** A file may open with a paragraph saying what the topic is and how the rules relate; a rule may carry explanation in its body. But a normative sentence outside a rule block has no ID and cannot be cited — so it does not exist as a rule, and a reviewer treats it as an error in the document, not as a rule of the system.
- **Values.** Unchanged from today: values live in `tokens/` and are rendered by `npm run tokens:report`. A rule says which token, never what it holds.
- **`## Open`.** A file's open questions stay a bulleted section, as `color.md` and `effects.md` have now. An open question is not a rule and takes no ID.

### 3.5 Precedence

- A rule lives in exactly one file — the file of its topic — and is cited by ID everywhere else. A restatement is a copy and drifts; a link does not.
- A narrower rule may narrow a broader one, never contradict it: a pattern may say which of a behaviour's options it takes; a contract may say which of a pattern's options a component takes. Where two rules contradict, the broader stands, the narrower is a defect, and the fix is either to amend the broader rule or to give the narrower one a named exception.
- A component contract stands in the same relation to a guideline: it narrows, it does not override.

### 3.6 Lifecycle

- **Adding:** the next number in the file — one higher than the highest ever used there. Gaps are normal.
- **Editing:** wording that keeps the meaning keeps the ID. A change of meaning is a new rule with a new ID, and the old one is deleted.
- **Deleting:** the block goes; its number is never reused; nothing records that it existed. Git history is the record, and the only one. This is the existing policy — an abandoned decision leaves no trace — applied to rules.

### 3.7 File header and status

Every guideline file opens with:

```markdown
# <Title>

Status: <Yet to fill | Partial | Confirmed>
Scope: <one sentence — what belongs here; where the neighbouring topic starts>
```

| Status | Means |
| --- | --- |
| Yet to fill | no rule yet; the scope line is the whole content |
| Partial | rules exist; named gaps remain — listed under `## Open` |
| Confirmed | the structure and the rules are settled; `## Open` may still list questions inside the settled model |

The directory `README.md` is a table of its files with their status, as `foundations/README.md` is today. The validator holds the two in agreement (§5).

## 4. The files

Every file below exists after this spec, with the header of §3.7. Those marked *migrate* exist today and are rewritten to the rule-block form; every other file is created as *Yet to fill* with the scope line given here. A scope line is the only content a new file carries — it is what stops the next rule from being written in the wrong place.

### 4.1 `docs/foundations/` — the visual language

| File | Scope |
| --- | --- |
| `color.md` | migrate |
| `typography.md` | migrate |
| `spacing.md` | migrate |
| `sizing.md` | migrate |
| `naming.md` | migrate |
| `icons.md` | migrate |
| `effects.md` | migrate |
| `accessibility.md` | migrate |
| `tokens.md` | how a value is bound — variable, style or raw — and when a raw value is legitimate; receives *Variables before raw values* in migration (§6) |
| `layout.md` | columns, panels, minimum and maximum widths, splitters; where a page is divided |
| `adaptivity.md` | what a screen does as the viewport narrows: the order in which things give way |
| `density.md` | the density modes, what each changes and what none may change |
| `elevation.md` | the layer order — panel, dropdown, popover, modal, toast — as one scale; what an elevation level means for a surface |
| `motion.md` | durations, easing, what may animate, and reduced motion |
| `theming.md` | the set of themes — light, dark, high contrast, forced colours — and how one is applied; the mode mechanism itself is `color.md` |
| `localization.md` | text expansion, direction, and what a layout must survive when the language changes |
| `charts.md` | series colour, axes, legends; what a chart takes from the palette and what it may not |

### 4.2 `docs/behavior/` — the laws components inherit

| File | Scope |
| --- | --- |
| `states.md` | the full set of interaction states, the precedence when they overlap, and what each may change |
| `focus.md` | focus visibility, order, initial focus, trapping, and return |
| `keyboard.md` | global keys, roving tabindex, shortcut ownership, conflicts with the browser and the OS |
| `pointer.md` | hit areas, hover intent, press versus click, the context menu, cursors |
| `selection.md` | single, multiple and range selection; selection from the keyboard; what survives a filter or a redraw |
| `overlays.md` | modality, dismissal, stacking, positioning, scroll lock |
| `disabled.md` | disabled, read-only and hidden — what each means and when each is used |
| `loading.md` | latency thresholds, skeleton versus spinner versus inline, blocking versus not, optimistic updates, cancellation |
| `validation.md` | when a value is validated, where the message lives, field-level versus form-level, recovery |
| `feedback.md` | inline, toast, alert, dialog — which channel carries which severity; duration, stacking, deduplication |
| `destructive.md` | confirmation versus undo; what is irreversible; how a confirmation is worded |
| `data-states.md` | the states every data surface must have: empty, first run, loading, partial, error, no permission, too many |
| `overflow.md` | truncate, wrap or scroll; the tooltip on truncation; minimum widths; column priority |
| `scrolling.md` | virtualization, sticky headers, position restore, scrolling from the keyboard |
| `manipulation.md` | drag, resize and reorder: where allowed, how a target is shown, cancellation, the keyboard alternative |
| `persistence.md` | which interface state survives a session — widths, sorts, filters, collapse — and where it is kept |
| `timing.md` | debounce, autosave, polling, timeouts, automatic dismissal |
| `text-input.md` | paste, IME, autofill, spellcheck, masks, undo inside a field |

### 4.3 `docs/patterns/` — one decided answer per recurring task

| File | Scope |
| --- | --- |
| `forms.md` | how a form is laid out, labelled, submitted and recovered |
| `tables.md` | the data table: columns, rows, density, actions, and what it composes from `behavior/` |
| `filtering.md` | where filters live, whether they apply on change or on demand, how active filters are shown and cleared |
| `sorting.md` | how sort is invoked and shown; multi-column sort; what a sort survives |
| `search.md` | search as distinct from filtering: scope, entry, results, no results |
| `navigation.md` | the primary and secondary navigation, panels, and the state they keep |
| `wizard.md` | multi-step flows: progress, validation per step, leaving and returning |
| `settings.md` | how settings are grouped, found, changed and saved |
| `dialogs.md` | when a dialog is the answer and when it is not; sizes, actions, dismissal |
| `notifications.md` | the notification surface: what reaches it, how it accumulates, how it is cleared |
| `bulk-actions.md` | acting on many selected items: the toolbar, the count, the confirmation |
| `code-editor.md` | the editing surface for code and queries |
| `first-run.md` | the empty product: what a person sees before there is data |
| `shortcuts.md` | the keyboard shortcut map and how it is discovered |
| `error-pages.md` | not found, no permission, failed: the full-page states |

### 4.4 `docs/content/` — the words

| File | Scope |
| --- | --- |
| `voice.md` | how the interface speaks: register, person, tense |
| `capitalization.md` | sentence case, title case, and where each applies |
| `terminology.md` | the one dictionary: the term for each thing, and the abbreviations that are allowed |
| `labels.md` | buttons and actions: the verb, the object, the length |
| `errors.md` | the shape of an error message: what happened, why, what to do |
| `empty-states.md` | what an empty surface says and offers |
| `help.md` | tooltip versus helper text versus documentation link; when each is used |
| `formats.md` | numbers, dates, times, units, currency, null and empty values |

### 4.5 The rest

| File | Prefix | Change |
| --- | --- | --- |
| `docs/RULES.md` | `RUL` | created — §3 |
| `docs/charter.md` §Principles | `PRN` | reserved for design principles; header `Status: Yet to fill` on the section — §6 |
| `docs/components/STANDARD.md` | `STD` | migrate: its normative statements become `STD-NN` blocks |
| `docs/README.md` §Editorial rules | — | the four rules move into `RULES.md` as `RUL-` rules; the section becomes a pointer |

## 5. The validator — `npm run validate:rules`

`tools/validate-rules.mjs`, on the model of `validate-registry.mjs`: contradictions fail, judgements are reported.

**Fails (exit 1):**

1. a level-3 heading beginning with an ID whose ID does not match the grammar, or whose area or topic does not match the file it is in;
2. an ID used twice anywhere;
3. a rule block whose statement does not open with a level, or that has no `Why:` paragraph;
4. an ID cited anywhere in `docs/`, `skills/src/`, `packages/ui/src/` or `tools/` (fixtures under `tools/tests/` excepted) that no rule carries — a citation is any token matching the grammar;

   **Amended 2026-09-09, in implementation:** a citation is a token matching the grammar *in prose*. One inside a fenced block or a code span is a specimen and is not checked, and fixtures written inline in a `*.test.mjs` are skipped along with those under `tools/tests/`. Under the literal reading the document defining the grammar could not satisfy it: §3.2's own example block cites `BEH-FOCUS-05`, a rule that does not exist and is not meant to. `RULES.md` RUL-11 states the distinction — a citation is bare text, backticks mark a specimen.
5. a guideline file without the header of §3.7, or with a status outside the vocabulary;
6. a directory `README.md` whose table disagrees with a file's status, or omits a file.

**Reports (exit 0):**

- per directory: files by status, rules per file;
- a *Confirmed* file with no rules — probably a file that should say *Partial* or *Yet to fill*;
- a rule with no `Checked by:` — information, not a fault; review is a legitimate check.

It runs in `npm test` and joins the definition of done in `CLAUDE.md` and `ARCHITECTURE.md` §7.

## 6. What moves out of `charter.md` §Principles

The section holds four entries today. They are rules of working, not principles of design, and each has a file to live in now. Nothing is dropped; each is relocated as a rule with an ID, and the charter section is emptied for the design principles, marked *Yet to fill*.

| Today | Goes to | As |
| --- | --- | --- |
| Components are public APIs | `docs/foundations/naming.md`, which already states it | the rule it already is there, with its ID |
| Variables before raw values | `docs/foundations/tokens.md` | `FND-TOKENS-01` — the one statement `color.md`, `effects.md` and `sizing.md` each restate today; after migration they cite it |
| Explicit exceptions over hidden inconsistency | `docs/RULES.md` | `RUL-` — it is §3.2's `Exception:` line, stated as a rule |
| One authored rule, many outputs | `docs/RULES.md` | `RUL-` — the editorial rule *a rule lives in one place* is the same rule; they merge |

## 7. Migration

One file at a time, each its own pull request, so a diff can be read against the file it rewrites.

1. `docs/RULES.md`, the four directories with their files and `README.md`s, the validator, and the document updates of §2 — one PR. From here every new file exists and the check runs.

   **Amended 2026-09-09, in implementation:** the eight existing foundations receive the header of §3.7 in this step too — `Status:` and `Scope:`, nothing else. Check 5 applies to every guideline file the moment the validator runs, so a header deferred to step 2 would mean a tree that fails its own check for the length of the migration. Their bodies are untouched until each one's own PR; until then `npm run validate:rules` reports each as *Confirmed and carries no rule block*, and that report is the migration queue.
2. Each existing foundation, in this order: `spacing.md`, `effects.md`, `accessibility.md`, `icons.md`, `typography.md`, `sizing.md`, `color.md`, `naming.md` — smallest first, so the form is settled on cheap files before it meets the two big ones.
3. `STANDARD.md`, then `charter.md` §Principles and `docs/README.md` together.

**What a migration does:** every normative sentence becomes a rule block, or is deliberately kept as explanation under the rule it explains, or is removed — and a removal is named in the PR, so that nothing leaves quietly. Values are still not transcribed. `## Open` sections stay. The file's status is set honestly: a foundation *Confirmed* today stays *Confirmed* unless migration shows it is not.

**What a migration does not do:** change a rule's meaning. A rule found wrong while migrating is a finding for the PR body, settled in its own change.

## 8. Acceptance

1. Every file in §4 exists, with the header of §3.7; a new file's scope line is its only content.
2. `docs/RULES.md` exists and every rule in it carries a `RUL-` ID.
3. The eight foundations, `STANDARD.md` and `docs/README.md` contain no normative sentence outside a rule block, and every rule block has an ID, a level and a `Why:`.
4. `docs/charter.md` §Principles is empty under `Status: Yet to fill`, and each of its four former entries is findable by ID where §6 sends it.
5. `npm run validate:rules` passes on the tree, fails on a duplicated ID, a dangling citation, a wrong topic segment and a missing level — one fixture each in `tools/tests/`.
6. `ARCHITECTURE.md` §1 names the guideline directories as a source of truth, §6 lists them as normative, and §7's definition of done includes `validate:rules`; `CLAUDE.md` says the same; `docs/README.md` lists `RULES.md` and the four directories.
7. `npm test`, `npm run validate:registry`, `npm run validate:skills` and `npm run tokens:check` still pass.
