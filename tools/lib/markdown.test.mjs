import test from "node:test";
import assert from "node:assert/strict";

import { inline, markdown } from "./markdown.mjs";

test("escapes before it renders, so a document cannot inject markup", () => {
  assert.equal(inline("a <script>alert(1)</script> b"), "a &lt;script&gt;alert(1)&lt;/script&gt; b");
});

test("renders the four inline forms", () => {
  assert.equal(inline("**bold**"), "<strong>bold</strong>");
  assert.equal(inline("an *aside*"), "an <em>aside</em>");
  assert.equal(inline("a `token`"), "a <code>token</code>");
  assert.equal(inline("[label](theming.md)"), '<a href="theming.md">label</a>');
});

test("a code span is literal — nothing inside it is emphasis", () => {
  // `**` in a code span is two asterisks, and this is the whole reason code
  // spans are lifted out first.
  assert.equal(inline("`**MUST**`"), "<code>**MUST**</code>");
  assert.equal(inline("`*/special/*`"), "<code>*/special/*</code>");
});

test("a link target can be rewritten, which is how a repository path reaches the site", () => {
  assert.equal(
    inline("[naming](../foundations/naming.md)", { href: (target) => `/at/${target}` }),
    '<a href="/at/../foundations/naming.md">naming</a>'
  );
});

test("a table needs its divider; a line of prose starting with a pipe is prose", () => {
  assert.match(markdown(["| A | B |", "| --- | --- |", "| 1 | 2 |"]), /^<table><thead>/);
  assert.match(markdown(["| not a table"]), /^<p>/);
});

test("lists, fences and headings", () => {
  assert.equal(markdown(["- one", "- two"]), "<ul><li>one</li><li>two</li></ul>");
  assert.equal(markdown(["1. first", "2. second"]), "<ol><li>first</li><li>second</li></ol>");
  assert.equal(markdown(["```", "**kept**", "```"]), "<pre><code>**kept**</code></pre>");
  // A `###` renders at the level the caller is nesting under, not at its own.
  assert.equal(markdown(["### Section"], { headingLevel: 3 }), "<h3>Section</h3>");
  assert.equal(markdown(["## Section"], { headingLevel: 3 }), "<h2>Section</h2>");
});

test("blank lines separate paragraphs and a wrapped list item stays one item", () => {
  assert.equal(markdown(["one", "", "two"]), "<p>one</p>\n<p>two</p>");
  assert.equal(markdown(["- first", "  wrapped", "- second"]), "<ul><li>first wrapped</li><li>second</li></ul>");
});
