# Rules of rules

Status: Confirmed
Scope: How a rule of this system is written, identified, cited, narrowed and retired; not what any rule says.

**This document is normative**: it has the same role for rules that [`components/STANDARD.md`](components/STANDARD.md) has for component contracts. Built by SPEC 0013.

A guideline carries more reasoning than a contract does, so guidelines stay in Markdown rather than moving into fields. The cost of prose is that nothing can point at it. When a sentence is quoted in another file, the two copies stop matching as soon as one is edited, and nothing notices. The grammar below gives back what fields would have given: an ID that can be cited, a citation that can be checked, and a build that fails when a citation points at nothing.

**A guideline file** is [`principles.md`](principles.md), this file, or a file in one of the four guideline directories: [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md), [`content/`](content/README.md). Each opens with the header RUL-15 describes and is listed in its directory's index.

One more document carries rules without being a guideline file: [`components/STANDARD.md`](components/STANDARD.md). It has its own shape and no per-file status to state, so it does not need the header. Everything else in this file applies to its rules exactly as written.

[`charter.md`](charter.md) carries no rules. It is prose about what the system is for, and a rule written inside it could not be cited or checked as a rule. That is why the principles have a file of their own.

`npm run validate:rules` checks all of it.

---

## The ID

### RUL-01 — A rule is a block with an ID

**MUST.** Every rule of this system is a rule block carrying an ID, and a normative sentence outside one is not a rule.

Why: a rule that cannot be cited is read once and then restated from memory. That is how two files come to state the same rule differently. An ID does not drift; a quotation does.

A file may open with a paragraph saying what its topic is, and a rule may carry explanation, a table or a list in its body. Neither may carry an obligation with no ID. A reviewer who finds one treats it as an error in the document, not as a rule of the system. Either it becomes a rule block or it becomes explanation.

Checked by: `npm run validate:rules`.

### RUL-02 — The ID follows the file the rule lives in

**MUST.** An ID is `AREA-TOPIC-NN`, where the area and the topic are those of the file the rule is in.

| Part | Is | Example |
| --- | --- | --- |
| `AREA` | one of `PRN` `FND` `BEH` `PAT` `CNT` `STD` `RUL` | `BEH` |
| `TOPIC` | the file's stem, upper-cased, hyphens kept | `focus.md` → `FOCUS` |
| `NN` | two digits, zero-padded, unique within the file | `03` |

| Area | Is |
| --- | --- |
| `PRN` | [`principles.md`](principles.md) — no topic segment: `PRN-01` |
| `FND` | [`foundations/`](foundations/README.md) — the visual language |
| `BEH` | [`behavior/`](behavior/README.md) — the laws components inherit |
| `PAT` | [`patterns/`](patterns/README.md) — one decided answer per recurring task |
| `CNT` | [`content/`](content/README.md) — the words |
| `STD` | [`components/STANDARD.md`](components/STANDARD.md) — no topic segment: `STD-01` |
| `RUL` | this file — no topic segment: `RUL-01` |

Why: the topic comes from the file's path, so a tool can check it instead of people keeping it by convention. A reader also knows from the ID alone which file to open.

Checked by: `npm run validate:rules`.

---

## The rule block

### RUL-03 — A rule block is a heading, a statement and a Why

**MUST.** A rule is a level-3 heading whose text begins with an ID, and everything under it up to the next heading of level 3 or higher; the heading is followed by a statement and a `Why:` paragraph.

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
| statement | yes | the first paragraph; opens with the level in bold |
| `Why:` | yes | one paragraph; the reasoning, inline |
| `Exception:` | when one exists | one per line — RUL-07 |
| `Checked by:` | when a check exists | RUL-08 |
| `Serves:` | optional | the principle IDs the rule follows from |

Why: a fixed shape is what lets a tool extract a rule. Once the block has a grammar, a tool can read the ID and the level and see whether reasoning is present. In free prose it can do none of these.

Checked by: `npm run validate:rules`.

### RUL-04 — The statement opens with its level

**MUST.** The first word of the statement is **MUST**, **SHOULD**, **MAY** or **RETIRED**, in bold, and the first three carry their RFC 2119 sense; no other word carries a level.

| Level | Means |
| --- | --- |
| **MUST** | a violation is a defect; a build or a review that finds one does not pass |
| **SHOULD** | the default; departing from it needs a stated reason at the point of departure |
| **MAY** | permitted; stated because someone would otherwise assume it was not |
| **RETIRED** | this was a rule and is not one now — the block stays so the ID still answers (RUL-14) |

Why: "should probably", "avoid", "prefer" and "never" look like four different strengths but amount to only one, and the reader decides which one. That reader is usually deciding whether their own exception is allowed.

Checked by: `npm run validate:rules`.

### RUL-05 — A rule states one decision

**MUST.** The statement is one sentence, imperative, about one decision.

Why: two decisions in one rule cannot be cited, given an exception or checked separately. And the second decision is the one nobody notices.

A rule whose body is a list is still one decision: `foundations/naming.md` §8 settles one thing, the canonical order, and its list is that order.

### RUL-06 — A prohibition needs a plausible violator

**MUST.** A rule is written only where someone would plausibly do the other thing.

Why: a document made mostly of prohibitions that nobody would break is a document nobody reads closely. The rules that matter then get the same quick skim as the rules that never mattered.

### RUL-07 — An exception is named in the rule it departs from

**MUST.** A valid departure is written as an `Exception:` line on the rule itself, named, and no wider than the case it covers.

Why: an exception written anywhere else cannot be told apart from a violation. An exception written broadly stops being an exception: it becomes general permission for the thing the rule forbids.

### RUL-08 — A rule names its check where one has been built

**SHOULD.** Where a command, a test or a skill can find a violation, the rule says so in `Checked by:`.

Why: the `Checked by:` line marks the difference between a rule the system checks and a rule the system only hopes is followed. A reader looks there to find out which kind they are reading.

An absent `Checked by:` means review. Review is a legitimate check, not a gap: most rules about judgement have no other one.

---

## The language

### RUL-19 — Plain English that a B2 reader follows

**MUST.** A rule and the text around it are written in plain English that a reader with B2-level English understands on the first reading, without losing precision.

Why: many people who read these files, and build from them, read English as a second language. A reader who has to decode a sentence acts on a guess about what it means, and a review cannot check a guess. Hard wording also hides gaps: the accessibility principle this set used to have was three metaphors around a rule that FND-ACCESSIBILITY-01 already stated, and nobody could see that until it was rewritten plainly.

- **The exact term stays.** Plain does not mean vague. Where a technical word is the exact one — `accessible name`, `token`, `WCAG 2.2 SC 2.5.8` — it is used, not replaced with an easier word that means something close.
- **One idiom or metaphor per rule, at most**, and only where it says the thing better than plain words would. Two images for one idea turn the rule into a puzzle.
- **Nothing is harder than the content needs.** A common word where it is exact, and a sentence that can be read once.

In review the test is simple: if a reader has to read a sentence twice to find out what it requires, the sentence is rewritten.

---

## What is not a rule

### RUL-09 — A rule names a token, never the value it holds

**MUST.** Where the system has a token for something, the rule names the token; the value stays in [`tokens/`](../tokens/README.md) and is read with `npm run tokens:report`.

Why: a number copied into prose becomes wrong at the next change in Figma. People build against a wrong number in a guideline before anyone re-reads the sentence around it.

### RUL-17 — Where a skill defines a rule for its own operation, the skill is the source

**MUST.** A rule about how a skill operates is stated in that skill and cited from a guideline, never restated in one.

Why: the skill is executed and the guideline is only read. If the two differ, nothing in the guideline shows it, and the skill's version is the one that takes effect. This covers only the narrow case of a skill's own procedure. For a design rule that the skill *enforces*, it is the other way round: the guideline is the source, and [`foundations/naming.md`](foundations/naming.md) says so explicitly for `stylos-naming-cleanup`.

### RUL-18 — A gap is stated, never filled with a plausible answer

**MUST.** Where something is not settled, the file says so under `## Open` and points at what will settle it; it does not supply a temporary answer.

Why: a week later, an invented answer cannot be told apart from a decided one, and people build against it. That is worse than the gap, because a gap at least makes someone stop. RUL-10 keeps a question from taking an ID; this rule keeps it from being answered by whoever happened to need it.

### RUL-10 — An unsettled question is not a rule

**MUST.** A question the system has not answered is a bullet under `## Open` in the file that would answer it, and takes no ID.

Why: an ID is a promise that something was decided. Giving one to a question makes the file unreadable in the one way that matters — a reader can no longer tell what they are allowed to build against.

---

## Precedence

### RUL-11 — A rule lives in one file and is cited by ID everywhere else

**MUST.** A rule is stated in the file of its topic; every other document, contract, skill and test points at it by ID rather than restating it.

Why: a restatement is a copy, and copies drift. This project has had to correct that failure more than once. A link cannot drift, and a citation that stops resolving fails the build instead of quietly becoming false.

A citation is bare text; backticks mark a specimen. An ID inside a code span or a fenced block is shown, not pointed at, and the check reads it the same way. That is how this document prints an example rule block without citing rules that do not exist.

Checked by: `npm run validate:rules` — a cited ID that no rule carries is a failure.

### RUL-12 — A narrower rule narrows, never contradicts

**MUST.** Where a narrower rule and a broader one contradict, the broader one stands and the narrower one is a defect.

Why: without a set direction, two rules that both look true leave the reader to guess which one the system means. The reader usually picks whichever rule is closer to their work.

Narrowing is what a narrower rule is for: a pattern says which of a behaviour's options it takes, and a component contract says which of a pattern's options it takes.

The fix for a real contradiction is one of two things, and never a third: amend the broader rule, or give the narrower one a named exception (RUL-07).

---

## Lifecycle

### RUL-13 — A new rule takes the next number its file has never used

**MUST.** Numbering runs one higher than the highest ever used in that file, and a number is never reused.

Why: a reused number makes an old citation resolve to a rule it did not mean. That is worse than a citation that fails, because nothing anywhere reports it.

There are no gaps in the sequence: a retired rule keeps its number and its place, marked **RETIRED** (RUL-14).

Exception: until the guideline set's first release, a file's numbering may be compacted, retired rules included, because nothing outside the repository has cited it yet. `foundations/color.md` was compacted on 2026-09-15.

### RUL-14 — A change of meaning is a new rule

**MUST.** Rewording that keeps the meaning keeps the ID; a change of what the rule requires is a new rule with a new ID, and the old one is retired.

Why: everything citing the old ID was checked against the old meaning. Editing meaning in place would leave every one of those citations pointing at something it was never reviewed against, and all of them would still resolve.

**A retired rule stays in its file**, in place, with its number, its statement in the past tense, the date it was retired and the reason:

```markdown
### FND-COLOR-09 — A role that diverges per mode is declared

**RETIRED** 2026-09-15. A role resolving to a different token per mode had to be declared in `tokens/_naming.yaml`.

Why: it asked for a fact the export already stated, and failed the build when nobody repeated it.
```

Why it stays rather than disappearing: someone is reading the rule somewhere this repository cannot see — in a review comment, a commit message, a contract written last month. The question they come with is whether it still holds. If the ID is missing from the file, the answer they get is that it was never a rule. A retired block tells them what it was, that it no longer holds, and since when.

Exception: until every rule has been confirmed for the first time — no file is *Draft* — a rule may change in place, meaning and number included. Delete this exception once the last draft is confirmed.
Checked by: `npm run validate:rules` — **RETIRED** is a level like the other three, so a retired block is still a rule block and still needs its reasoning.

---

## The file

### RUL-15 — Every guideline file opens with a status and a scope

**MUST.** A guideline file opens with its title, a `Status:` from the vocabulary below, and a one-sentence `Scope:` saying what belongs in it and where the neighbouring topic starts.

```markdown
# <Title>

Status: <Yet to fill | Draft | Partial | Confirmed>
Scope: <one sentence>
```

| Status | Means |
| --- | --- |
| Yet to fill | no rule yet; the scope line is the whole content |
| Draft | rules are written and not yet confirmed; they can still change |
| Partial | rules exist; named gaps remain, listed under `## Open` |
| Confirmed | the structure and the rules are settled; `## Open` may still list questions inside the settled model |

Why: an empty file with a scope line gives the next rule a place to go, so that rule is not written in a contract's `notes` or in a spec instead. *Yet to fill* is also a true statement about the system; saying nothing is not.

Checked by: `npm run validate:rules`.

### RUL-16 — A directory index agrees with its files

**MUST.** Each guideline directory's `README.md` lists every file in it with that file's status, and nothing else that a file already states.

Why: an index is read before the files are, so an index that disagrees with them is worse than no index. The disagreement is always found last, by someone who has already built on the index.

Checked by: `npm run validate:rules`.
