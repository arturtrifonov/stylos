import test from "node:test";
import assert from "node:assert/strict";

import { renderHome } from "./build-home.mjs";

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
