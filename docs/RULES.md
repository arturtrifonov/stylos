# Rules of rules

Status: Confirmed
Scope: How a rule of this system is written, identified, cited, narrowed and retired; not what any rule says.

**This document is normative**, in the position [`components/STANDARD.md`](components/STANDARD.md) holds for component contracts. Built by [SPEC 0013](specs/0013-guideline-structure.md).

A guideline carries more reasoning than a contract does, so guidelines stay Markdown rather than moving into fields. The cost of prose is that nothing can point at it: a sentence quoted somewhere else drifts the moment it is edited, and nothing notices. The grammar below buys back what the fields would have given — an ID that can be cited, a citation that can be checked, and a build that fails when one points at nothing.

**A guideline file** is a file in one of the four guideline directories — [`foundations/`](foundations/README.md), [`behavior/`](behavior/README.md), [`patterns/`](patterns/README.md), [`content/`](content/README.md) — or this one. Each carries the header of RUL-15 and is indexed by its directory.

Two more documents carry rules without being guideline files: [`charter.md`](charter.md) §Principles and [`components/STANDARD.md`](components/STANDARD.md). Both have their own shape and neither has a per-file status to state, so the header is not asked of them; everything else here applies to their rules exactly as written.

`npm run validate:rules` checks all of it.

---

## The ID

### RUL-01 — A rule is a block with an ID

**MUST.** Every rule of this system is a rule block carrying an ID, and a normative sentence outside one is not a rule.

Why: a rule that cannot be cited is read once and restated from memory afterwards, which is how two files come to state the same rule differently. An ID does not drift; a quotation does.

A file may open with a paragraph saying what its topic is, and a rule may carry explanation, a table or a list in its body. What it may not carry is an obligation with no handle. A reviewer who finds one treats it as an error in the document, not as a rule of the system — either it becomes a rule block or it becomes explanation.

Checked by: `npm run validate:rules`.

### RUL-02 — The ID follows the file the rule lives in

**MUST.** An ID is `AREA-TOPIC-NN`, where the area and the topic are the ones the rule's own file has.

| Part | Is | Example |
| --- | --- | --- |
| `AREA` | one of `PRN` `FND` `BEH` `PAT` `CNT` `STD` `RUL` | `BEH` |
| `TOPIC` | the file's stem, upper-cased, hyphens kept | `focus.md` → `FOCUS` |
| `NN` | two digits, zero-padded, unique within the file | `03` |

| Area | Is |
| --- | --- |
| `PRN` | [`charter.md`](charter.md) §Principles — no topic segment: `PRN-01` |
| `FND` | [`foundations/`](foundations/README.md) — the visual language |
| `BEH` | [`behavior/`](behavior/README.md) — the laws components inherit |
| `PAT` | [`patterns/`](patterns/README.md) — one decided answer per recurring task |
| `CNT` | [`content/`](content/README.md) — the words |
| `STD` | [`components/STANDARD.md`](components/STANDARD.md) — no topic segment: `STD-01` |
| `RUL` | this file — no topic segment: `RUL-01` |

Why: derived from the path, the topic is checkable rather than conventional, and a reader knows which file to open from the ID alone.

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

Why: a fixed shape is what makes a rule extractable — the ID, the level and the presence of reasoning are all mechanical once the block has a grammar, and none of them is mechanical in free prose.

Checked by: `npm run validate:rules`.

### RUL-04 — The statement opens with its level

**MUST.** The first word of the statement is **MUST**, **SHOULD** or **MAY**, in bold, in the RFC 2119 sense, and no other word carries a level.

| Level | Means |
| --- | --- |
| **MUST** | a violation is a defect; a build or a review that finds one does not pass |
| **SHOULD** | the default; departing from it needs a stated reason at the point of departure |
| **MAY** | permitted; stated because someone would otherwise assume it was not |

Why: "should probably", "avoid", "prefer" and "never" read as four strengths and are worth one, and which one is left to the reader — who is usually deciding whether their exception is allowed.

Checked by: `npm run validate:rules`.

### RUL-05 — A rule states one decision

**MUST.** The statement is one sentence, imperative, about one decision.

Why: two decisions in one rule cannot be cited separately, cannot be excepted separately, and cannot be checked separately — and the second one is the one nobody notices.

A rule whose body is a list is still one decision: `foundations/naming.md` §8 settles one thing, the canonical order, and the list is what the order is.

### RUL-06 — A prohibition needs a plausible violator

**MUST.** A rule is written only where someone would plausibly do the other thing.

Why: a document made mostly of prohibitions nobody would break is one nobody reads closely, and the rules that matter are then found in the same skim as the ones that never did.

### RUL-07 — An exception is named in the rule it departs from

**MUST.** A valid departure is written as an `Exception:` line on the rule itself, named, and no wider than the case it covers.

Why: an exception written anywhere else is indistinguishable from a violation, and an exception written broadly stops being an exception — it becomes general permission for the thing the rule forbids.

### RUL-08 — A rule names its check where one has been built

**SHOULD.** Where a command, a test or a skill can find a violation, the rule says so in `Checked by:`.

Why: it is the difference between a rule the system holds and a rule the system hopes for, and the line is where a reader looks to find out which one they are reading.

An absent `Checked by:` means review. That is a legitimate check and not a gap — most rules about judgement have no other one.

---

## What is not a rule

### RUL-09 — A rule names a token, never the value it holds

**MUST.** Where the system has a token for something, the rule names the token; the value stays in [`tokens/`](../tokens/README.md) and is read with `npm run tokens:report`.

Why: a number copied into prose is wrong at the next change in Figma, and a wrong number in a guideline is built against before anyone re-reads the sentence around it.

### RUL-10 — An unsettled question is not a rule

**MUST.** A question the system has not answered is a bullet under `## Open` in the file that would answer it, and takes no ID.

Why: an ID is a promise that something was decided. Giving one to a question makes the file unreadable in the one way that matters — a reader can no longer tell what they are allowed to build against.

---

## Precedence

### RUL-11 — A rule lives in one file and is cited by ID everywhere else

**MUST.** A rule is stated in the file of its topic; every other document, contract, skill and test points at it by ID rather than restating it.

Why: a restatement is a copy, and copies drift — this project has had to correct that failure more than once. A link cannot drift, and a citation that stops resolving fails the build instead of quietly becoming false.

A citation is bare text; backticks mark a specimen. An ID inside a code span or a fenced block is being shown rather than pointed at — which is how this document prints an example rule block without citing rules that do not exist — and the check reads it the same way.

Checked by: `npm run validate:rules` — a cited ID that no rule carries is a failure.

### RUL-12 — A narrower rule narrows, never contradicts

**MUST.** A pattern may say which of a behaviour's options it takes, and a component contract may say which of a pattern's options it takes; where two rules contradict, the broader one stands and the narrower one is a defect.

Why: without a direction, two true-looking rules leave the reader to guess which is the system's, and the guess is usually the one nearer to hand.

The fix for a real contradiction is one of two things, and never a third: amend the broader rule, or give the narrower one a named exception (RUL-07).

---

## Lifecycle

### RUL-13 — A new rule takes the next number its file has never used

**MUST.** Numbering runs one higher than the highest ever used in that file, and a number is never reused.

Why: a reused number makes an old citation resolve to a rule that is not the one it meant — which is worse than a citation that fails, because nothing anywhere reports it.

Gaps in the sequence are normal and mean a rule was deleted.

### RUL-14 — A change of meaning is a new rule

**MUST.** Rewording that keeps the meaning keeps the ID; a change of what the rule requires is a new rule with a new ID, and the old one is deleted.

Why: everything citing the old ID was checked against the old meaning. Editing meaning in place would leave every one of those citations pointing at something it was never reviewed against, and all of them would still resolve.

A deleted rule leaves no trace and no tombstone — git history is the record, as it already is for an abandoned decision.

---

## The file

### RUL-15 — Every guideline file opens with a status and a scope

**MUST.** A guideline file opens with its title, a `Status:` from the vocabulary below, and a one-sentence `Scope:` saying what belongs in it and where the neighbouring topic starts.

```markdown
# <Title>

Status: <Yet to fill | Partial | Confirmed>
Scope: <one sentence>
```

| Status | Means |
| --- | --- |
| Yet to fill | no rule yet; the scope line is the whole content |
| Partial | rules exist; named gaps remain, listed under `## Open` |
| Confirmed | the structure and the rules are settled; `## Open` may still list questions inside the settled model |

Why: an empty file with a scope line is a place, and a place is what stops the next rule from being written in a contract's `notes` or in a spec. *Yet to fill* is also a true statement about the system, where silence is not.

Checked by: `npm run validate:rules`.

### RUL-16 — A directory index agrees with its files

**MUST.** Each guideline directory's `README.md` lists every file in it with that file's status, and nothing else that a file already states.

Why: an index is read before the files are, so an index that disagrees with them is worse than none — and the disagreement is always found last, by someone who built on the index.

Checked by: `npm run validate:rules`.
