import test from "node:test";
import assert from "node:assert/strict";

import { batchProgress, renderHome } from "./build-home.mjs";

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

// --- the implementation queue ------------------------------------------------

const queued = [
  { id: "A", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" }, import: { batch: 1 } },
  { id: "B", api: [], import: { batch: 1 } },
  { id: "C", api: [], import: { batch: 2 } },
  { id: "D", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-2" } },
];

test("counts each batch against its own size, in batch order", () => {
  assert.deepEqual(
    batchProgress(queued).map(({ batch, total, done, percent }) => ({ batch, total, done, percent })),
    [
      { batch: 1, total: 2, done: 1, percent: 50 },
      { batch: 2, total: 1, done: 0, percent: 0 },
      { batch: null, total: 1, done: 1, percent: 100 },
    ]
  );
});

test("gives the unbatched entries a row rather than dropping them", () => {
  // They are where the finished work currently is; leaving them out would show
  // empty bars and call that the state of the system.
  const html = renderHome({ entries: queued, generated: "2026-08-28" });
  assert.match(html, /class="unbatched"/);
  assert.match(html, /no batch/);
});

test("writes the count and the percent beside every bar, never the bar alone", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28" });
  assert.match(html, /<span class="of">1 \/ 2<\/span>/);
  assert.match(html, /<span class="pct">50%<\/span>/);
  assert.match(html, /aria-label="1 of 2 ready"/);
});

test("says less than one percent rather than rounding a finished component to zero", () => {
  const many = [
    { id: "done", api: [], summary: "s", purpose: "p", useWhen: ["u"], figma: { node_id: "1-1" }, import: { batch: 1 } },
    ...Array.from({ length: 400 }, (_, i) => ({ id: `x${i}`, api: [], import: { batch: 1 } })),
  ];
  assert.equal(batchProgress(many)[0].percent, 0);
  assert.match(renderHome({ entries: many, generated: "2026-08-28" }), /<span class="pct">&lt;1%<\/span>/);
});

test("names the batches as history rather than as a plan", () => {
  const html = renderHome({ entries: queued, generated: "2026-08-28" });
  assert.match(html, /history, not a\s+live plan/);
  assert.match(html, /2026-08-20/);
});
