import test from "node:test";
import assert from "node:assert/strict";

import {
  CORE_MILESTONE,
  milestoneById,
  milestoneMembers,
  milestoneNames,
  milestoneProgress,
  parseMilestones,
  parseWaves,
  plannedIds,
  waveById,
  waveMembers,
  waveProgress,
  whereWeAre,
} from "./plan.mjs";

// PLAN.md in miniature — both tables, including the family shorthand the real
// §4 uses. The fixture is a document rather than data, because a document is
// what the parser has to survive.
const plan = `## 4. Stages

| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Selection controls | Badge, Checkbox Input / Label | a form column | 1 wk |
| 2 | The table | Table / TD Text | a dense table | 2 wk |

Text after the table.

## 9. After v0.1 — the milestones

| Milestone | The decision it opens | Entries |
| --- | --- | --- |
| alpha | the decision that it is ready for **internal** use | Tooltip, Toggle |
| Parked | no decision waits on these | Chips |

Text after that one too.
`;

const ready = { api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" } };

const entries = [
  { id: "Badge", ...ready },
  { id: "Checkbox Input", family: "Checkbox", api: [] },
  { id: "Checkbox Label", family: "Checkbox", api: [] },
  { id: "Table / TD Text", ...ready },
  { id: "Tooltip", api: [] },
  { id: "Toggle", ...ready },
  { id: "Chips", api: [] },
];

// --- §4, the waves -----------------------------------------------------------

test("reads the waves out of the plan rather than holding a copy of them", () => {
  assert.deepEqual(
    parseWaves(plan).map(({ number, name, tokens }) => ({ number, name, tokens })),
    [
      { number: 1, name: "Selection controls", tokens: ["Badge", "Checkbox Input / Label"] },
      { number: 2, name: "The table", tokens: ["Table / TD Text"] },
    ]
  );
});

test("expands the family shorthand into every member it names", () => {
  assert.deepEqual(waveMembers(plan, entries)[0].ids, ["Badge", "Checkbox Input", "Checkbox Label"]);
});

// `Table / TD Text` is an id and `Checkbox Input / Label` is a shorthand for
// two — the same punctuation, so the id is tried first and the shorthand read
// only where it is not one.
test("reads a full id before reading a slash as family shorthand", () => {
  assert.deepEqual(waveMembers(plan, entries)[1].ids, ["Table / TD Text"]);
});

test("counts each wave against its own size, in the plan's order", () => {
  assert.deepEqual(
    waveProgress(plan, entries).map(({ number, total, done, percent }) => ({ number, total, done, percent })),
    [
      { number: 1, total: 3, done: 1, percent: 33 },
      { number: 2, total: 1, done: 1, percent: 100 },
    ]
  );
});

// Absent rather than zero: unsequenced work is not position zero in the order,
// and a cell reading 0 would say it was.
test("gives no wave to an entry the waves do not sequence", () => {
  const map = waveById(plan, entries);
  assert.equal(map.get("Checkbox Label"), 1);
  assert.equal(map.has("Tooltip"), false);
});

test("throws on a wave naming something the registry does not hold", () => {
  assert.throws(
    () => waveProgress(plan.replace("Badge,", "Buttton,"), entries),
    /wave 1 names "Buttton", which is no registry id/
  );
});

test("throws rather than guessing when the plan has no wave table", () => {
  assert.throws(() => parseWaves("# A plan with no table\n"), /no wave table/);
});

// --- §9, the milestones ------------------------------------------------------

test("reads the milestones and the decision each one opens, in the plan's order", () => {
  assert.deepEqual(
    parseMilestones(plan).map(({ name, tokens }) => ({ name, tokens })),
    [
      { name: "alpha", tokens: ["Tooltip", "Toggle"] },
      { name: "Parked", tokens: ["Chips"] },
    ]
  );
  assert.match(parseMilestones(plan)[0].opens, /ready for \*\*internal\*\* use/);
});

test("resolves a milestone's members the same way a wave's are resolved", () => {
  assert.deepEqual(milestoneMembers(plan, entries)[0].ids, ["Tooltip", "Toggle"]);
});

test("throws on a milestone naming something the registry does not hold", () => {
  assert.throws(
    () => milestoneMembers(plan.replace("| Tooltip,", "| Toolteep,"), entries),
    /milestone "alpha" names "Toolteep"/
  );
});

// §4 *is* the core milestone's checklist, so it is not listed twice — the two
// tables meet here and nowhere else.
test("puts everything a wave names in the core milestone", () => {
  const map = milestoneById(plan, entries);
  assert.equal(map.get("Badge"), CORE_MILESTONE);
  assert.equal(map.get("Checkbox Label"), CORE_MILESTONE);
  assert.equal(map.get("Tooltip"), "alpha");
  assert.equal(map.get("Chips"), "Parked");
});

test("names the core milestone first and keeps the plan's order after it", () => {
  assert.deepEqual(milestoneNames(plan), ["0.1", "alpha", "Parked"]);
});

test("counts the core milestone from the waves and the rest from their own rows", () => {
  assert.deepEqual(
    milestoneProgress(plan, entries).map(({ name, total, done }) => ({ name, total, done })),
    [
      { name: "0.1", total: 4, done: 2 },
      { name: "alpha", total: 2, done: 1 },
      { name: "Parked", total: 1, done: 0 },
    ]
  );
});

// Reading a renamed header as "there are no milestones" would empty a facet, a
// column and a chart at once, and every one of them would look deliberate.
test("throws, naming the stale header, when §9 still says Group", () => {
  const stale = plan.replace("| Milestone | The decision it opens | Entries |", "| Group | Unlocks | Entries |");
  assert.throws(() => parseMilestones(stale), /still carries the old Group \/ Unlocks header/);
});

test("throws when there is no milestone table at all", () => {
  assert.throws(() => parseMilestones("# A plan with only waves\n"), /no milestone table/);
});

// --- both tables together ----------------------------------------------------

test("counts an entry as planned whichever table names it", () => {
  const planned = plannedIds(plan, entries);
  assert.equal(planned.has("Badge"), true, "named by a wave");
  assert.equal(planned.has("Tooltip"), true, "named by a milestone");
  assert.equal(planned.size, entries.length);
});

test("says where the work is — the first unfinished milestone and wave", () => {
  const here = whereWeAre(plan, entries);
  assert.equal(here.milestone.name, "0.1");
  assert.equal(here.wave.number, 1);
  assert.equal(here.waves, 2);
});

// Nothing left open is an answer, not a gap, so the caller gets null rather
// than a row it has to recognise as finished.
test("reports no open wave once every wave is done", () => {
  const all = entries.map((entry) => ({ ...entry, ...ready }));
  assert.equal(whereWeAre(plan, all).wave, null);
  assert.equal(whereWeAre(plan, all).milestone, null);
});
