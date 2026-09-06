import test from "node:test";
import assert from "node:assert/strict";

import { renderSiteHeader, renderSiteFooter } from "./chrome.mjs";

test("renders the three pages at the given depth, the current one marked", () => {
  const html = renderSiteHeader({ prefix: "../", active: "components" });
  assert.match(html, /href="\.\.\/index\.html"/);
  assert.match(html, /<a href="\.\.\/components\/index\.html" aria-current="page">Components<\/a>/);
  assert.match(html, /href="\.\.\/registry\.html"/);
});

test("every optional link is derived — absent input, absent link", () => {
  const bare = renderSiteHeader({});
  assert.doesNotMatch(bare, /storybook/i);
  assert.doesNotMatch(bare, /figma/i);
  assert.doesNotMatch(bare, /github/i);

  const full = renderSiteHeader({
    storybook: true,
    figmaUrl: "https://www.figma.com/design/abc/Stylos--Components",
    repoUrl: "https://github.com/arturtrifonov/stylos",
  });
  assert.match(full, /href="storybook\/"/);
  assert.match(full, /href="https:\/\/www\.figma\.com\/design\/abc\/Stylos--Components"/);
  assert.match(full, /href="https:\/\/github\.com\/arturtrifonov\/stylos"/);
});

test("falls back to the name when there is no wordmark", () => {
  assert.match(renderSiteHeader({}), /<span class="brand-name">Stylos<\/span>/);
  assert.match(renderSiteHeader({ logo: "<svg class=\"logo\"></svg>" }), /<svg class="logo">/);
});

test("carries no script — the component pages assert they have none", () => {
  assert.doesNotMatch(renderSiteHeader({ storybook: true }), /<script/);
  assert.doesNotMatch(renderSiteFooter({}), /<script/);
});

test("the footer states provenance and the derived version", () => {
  const html = renderSiteFooter({ generated: "2026-09-06", version: "0.1.0", repoUrl: "https://github.com/x/y" });
  assert.match(html, /v0\.1\.0/);
  assert.match(html, /2026-09-06/);
  assert.match(html, /docs\/components\/registry\//);
  assert.match(html, /github\.com\/x\/y/);
  assert.doesNotMatch(renderSiteFooter({}), /v0\./);
});
