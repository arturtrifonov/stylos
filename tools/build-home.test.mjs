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

// SPEC 0011 §4: a site may link out; a page still may not load anything
// remote. The allowlist is exact origins, all of them navigation.
const site = {
  figma: [
    {
      name: "Stylos / Components",
      url: "https://www.figma.com/design/bbb/Stylos--Components",
      key: "bbb",
      contents: "component definitions",
    },
  ],
  npm: { name: "@stylos/ui", version: "0.1.0", private: true },
  repo: "https://github.com/arturtrifonov/stylos",
  storybook: true,
  version: "0.1.0",
  distribution: "planned",
};

const ALLOWED_REMOTE = (url) =>
  url.startsWith("https://www.figma.com/design/") ||
  url === site.repo ||
  url === "http://www.w3.org/2000/svg";

test("reaches nothing over the network — the only remote URLs are the allowlisted links out", () => {
  for (const html of [home(), home({ site })]) {
    const remote = [...html.matchAll(/(https?:)?\/\/[^"'\s)]+/g)].map((m) => m[0]);
    assert.ok(
      remote.every(ALLOWED_REMOTE),
      `unexpected remote reference: ${remote.filter((u) => !ALLOWED_REMOTE(u))}`
    );
    assert.doesNotMatch(html, /<script/);
    assert.doesNotMatch(html, /<link[^>]+stylesheet/);
    assert.doesNotMatch(html, /fetch\(/);
  }
});

test("a fixture without site facts carries no external link at all", () => {
  assert.deepEqual([...home().matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), []);
});

// --- the derived facts (SPEC 0011 §2) ----------------------------------------

test("the header links what the tree holds and nothing more", () => {
  const html = home({ site });
  assert.match(html, /href="storybook\/"/);
  assert.match(html, /href="https:\/\/www\.figma\.com\/design\/bbb\/Stylos--Components"/);
  assert.match(html, /href="https:\/\/github\.com\/arturtrifonov\/stylos"/);

  const without = home({ site: { ...site, storybook: false, repo: null, figma: [] } });
  assert.doesNotMatch(without, /storybook\//);
  assert.doesNotMatch(without, /github\.com/);
  assert.doesNotMatch(without, /figma\.com/);
});

test("the version pill is derived, and Pre-alpha is the fallback", () => {
  assert.match(home({ site }), /<span class="flag">v0\.1\.0<\/span>/);
  assert.match(home(), /<span class="flag">Pre-alpha<\/span>/);
});

test("npm install is Planned exactly while the package is private", () => {
  const planned = home({ site });
  assert.match(planned, /npm install @stylos\/ui/);
  const block = planned.slice(planned.indexOf("The package"), planned.indexOf("npm install") + 40);
  assert.match(block, /Planned/);

  const published = home({ site: { ...site, npm: { ...site.npm, private: false } } });
  const pubBlock = published.slice(published.indexOf("The package"), published.indexOf("npm install") + 40);
  assert.doesNotMatch(pubBlock, /Planned/);
});

test("the agent artifacts flip with SPEC 0010's status", () => {
  assert.match(home({ site }), /registry\.json/);
  const shipped = home({ site: { ...site, distribution: "built" } });
  const agents = shipped.slice(shipped.indexOf("registry.json") - 200, shipped.indexOf("registry.json") + 100);
  assert.doesNotMatch(agents, /Planned/);
});

test("quick start and the extra resources are absent without site facts", () => {
  const html = home();
  assert.doesNotMatch(html, /npm install/);
  assert.doesNotMatch(html, /Figma libraries/);
});

// --- the sample (SPEC 0011 §5) -----------------------------------------------

const showcase = {
  css: ".stylos-badge { color: var(--stylos-color-text-base); }",
  built: 1,
  groups: [
    {
      id: "Badge",
      name: "Badge",
      note: "a note",
      samples: [{ html: '<span class="stylos-badge" data-tone="base" data-size="medium">3</span>', label: "base" }],
    },
  ],
};

test("the sample renders the shipped markup and inlines the shipped CSS", () => {
  const html = home({ showcase });
  assert.match(html, /<span class="stylos-badge" data-tone="base" data-size="medium">3<\/span>/);
  assert.ok(html.includes(showcase.css));
  assert.match(html, /Nothing on this page is a mockup/);
  assert.match(html, /<span class="n">1<\/span><span class="k">in code<\/span>/);
});

test("no sample, no section — absent rather than empty", () => {
  const html = home();
  assert.doesNotMatch(html, /class="showcase"/);
  assert.doesNotMatch(html, /in code/);
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
