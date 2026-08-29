import test from "node:test";
import assert from "node:assert/strict";

import { parseWaves, waveById, waveMembers, waveProgress } from "./plan.mjs";

// PLAN.md Stage 4 in miniature, including the family shorthand the real table
// uses. The fixture is a document rather than data, because a document is what
// the parser has to survive.
const plan = `## 4. Stages

| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Selection controls | Badge, Checkbox Input / Label | a form column | 1 wk |
| 2 | The table | Table / TD Text | a dense table | 2 wk |

Text after the table.
`;

const entries = [
  { id: "Badge", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" } },
  { id: "Checkbox Input", family: "Checkbox", api: [] },
  { id: "Checkbox Label", family: "Checkbox", api: [] },
  { id: "Table / TD Text", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-2" } },
  { id: "Tooltip", api: [] },
];

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

// Absent rather than zero: not being scheduled for v0.1 is not a position in
// the order, and a row reading "wave 0" would say it was.
test("gives no wave to an entry outside the core set", () => {
  const map = waveById(plan, entries);
  assert.equal(map.get("Checkbox Label"), 1);
  assert.equal(map.get("Table / TD Text"), 2);
  assert.equal(map.has("Tooltip"), false);
});

test("throws on a wave naming something the registry does not hold", () => {
  assert.throws(
    () => waveProgress(plan.replace("Badge,", "Buttton,"), entries),
    /names "Buttton", which is no registry id/
  );
});

test("throws rather than guessing when the plan has no wave table", () => {
  assert.throws(() => parseWaves("# A plan with no table\n"), /no wave table/);
});
