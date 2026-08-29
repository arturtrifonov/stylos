import test from "node:test";
import assert from "node:assert/strict";

import { renderHome } from "./build-home.mjs";
import { waveProgress } from "./lib/plan.mjs";

const entries = [
  { id: "Badge", name: "Badge", summary: "s", purpose: "p", useWhen: ["u"], api: [], figma: { node_id: "1-2" } },
  { id: "Icon", name: "Icon", api: [] },
];

function home(overrides = {}) {
  return renderHome({ entries, generated: "2026-08-28", ...overrides });
}

test("counts the same three things the registry viewer derives", () => {
  const html = home();
  assert.match(html, /<span class="n">2<\/span><span class="k">components<\/span>/);
  assert.match(html, /<span class="n">1<\/span><span class="k">with a contract<\/span>/);
  assert.match(html, /<span class="n">1<\/span><span class="k">ready<\/span>/);
});

test("opens onto both views and neither is a dead end", () => {
  const html = home();
  assert.match(html, /href="registry\.html"/);
  assert.match(html, /href="components\/index\.html"/);
});

test("leaves the capital out when it is not in the repository", () => {
  assert.doesNotMatch(home(), /column\.png/);
  assert.match(home({ column: true }), /src="assets\/column\.png"/);
});

test("renders without a theme or a wordmark rather than failing to build", () => {
  const html = home();
  assert.match(html, /<title>Stylos<\/title>/);
  assert.doesNotMatch(html, /<svg/);
});

test("reaches nothing over the network", () => {
  assert.deepEqual([...home().matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((m) => m[0]), []);
});

// --- the wave chart ----------------------------------------------------------

// PLAN.md in miniature, both tables. Parsing them is lib/plan.test.mjs's
// subject; what is tested here is what the page does with the result.
const plan = `## 4. Stages

| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Selection controls | Badge, Checkbox Input / Label | a form column | 1 wk |
| 2 | The table | Table / TD Text | a dense table | 2 wk |

Text after the table.

## 9. After v0.1 — the milestones

| Milestone | The decision it opens | Entries |
| --- | --- | --- |
| alpha | the decision that it is ready for **internal** use | Tooltip |
| Parked | no decision waits on these | Chips |
`;

const queued = [
  { id: "Badge", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" } },
  { id: "Checkbox Input", family: "Checkbox", api: [] },
  { id: "Checkbox Label", family: "Checkbox", api: [] },
  { id: "Table / TD Text", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-2" } },
  { id: "Tooltip", api: [] },
  { id: "Chips", api: [] },
];

test("writes the count and the percent beside every bar, never the bar alone", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  assert.match(html, /<span class="of">1 \/ 3<\/span>/);
  assert.match(html, /<span class="pct">33%<\/span>/);
  assert.match(html, /aria-label="1 of 3 ready"/);
});

test("names the waves as the plan's order rather than as a schedule", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  assert.match(html, /Wave 1<\/span>Selection controls/);
  assert.match(html, /PLAN\.md/);
  assert.doesNotMatch(html, /Batch/);
});

// --- the milestones ----------------------------------------------------------

// The question the page exists to answer, in one sentence, above everything
// that details it.
test("opens with where the work is", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  assert.match(html, /Working towards 0\.1<\/span><span class="rest"> — wave 1 of 2, 2 of 4 components ready\./);
  assert.ok(html.indexOf('class="here"') < html.indexOf('class="queue"'), "the sentence comes first");
});

test("draws one bar per milestone, below the waves, with the decision each opens", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  assert.ok(html.indexOf('class="queue milestones"') > html.indexOf("The core set, wave by wave"));
  assert.match(html, /<span class="num">0\.1<\/span>/);
  assert.match(html, /<span class="num">alpha<\/span>/);
  assert.match(html, /ready for <strong>internal<\/strong> use/, "the cell's Markdown is rendered, not printed");
});

// Nothing waits on Parked, so a progress bar would imply something does.
test("leaves Parked out of the chart", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  assert.doesNotMatch(html, /<span class="num">Parked<\/span>/);
});

// A milestone is a checklist, not a quantity of work, so 43 against 8 is not
// drawn as a wider bar. Only the waves scale their tracks.
test("gives every milestone track the same width and only varies the fill", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28", plan });
  const chart = html.slice(html.indexOf('class="queue milestones"'));
  assert.deepEqual([...chart.matchAll(/<span class="track" style=/g)], []);
});

test("says less than one percent rather than rounding a finished component to zero", () => {
  const many = [
    { id: "Badge", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" } },
    ...Array.from({ length: 400 }, (_, i) => ({ id: `x${i}`, api: [] })),
  ];
  const wide = `| # | Wave | Entries | Ends with | Est. |
| --- | --- | --- | --- | ---: |
| 1 | Everything | ${many.map((entry) => entry.id).join(", ")} | a screen | 1 wk |

| Milestone | The decision it opens | Entries |
| --- | --- | --- |
| alpha | nothing left over | ${many[0].id} |
`;
  assert.equal(waveProgress(wide, many)[0].percent, 0);
  assert.match(renderHome({ entries: many, generated: "2026-08-28", plan: wide }), /<span class="pct">&lt;1%<\/span>/);
});

// A fixture with no plan is the ordinary case in these tests, and an empty
// chart would be worse than no chart.
test("omits the section entirely when there is no plan to read", () => {
  assert.doesNotMatch(home(), /class="queue"/);
});
