import test from "node:test";
import assert from "node:assert/strict";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadGuidelines, splitRule } from "./lib/guidelines.mjs";
import {
  buildGuidelinePages,
  buildGuidelinesData,
  linkCitations,
  linkRewriter,
  renderIndex,
  renderPage,
} from "./build-guidelines-view.mjs";

// Built against the real guideline set, for the same reason the registry view
// is: the checks worth having — a rule body that renders wrong, an ID that
// resolves nowhere — are checks on what the documents actually contain.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data = buildGuidelinesData(root, { generated: "2026-09-15", repoUrl: "https://example.test/repo" });

test("every guideline document is in the set, filled or not", () => {
  assert.equal(data.totals.files, data.files.length);
  assert.ok(data.totals.empty > 0, "the set has files with no rules, and they are counted");
  assert.equal(data.totals.written + data.totals.empty, data.totals.files);
});

test("a rule body splits into the parts RUL-03 names", () => {
  const parts = splitRule({
    statement: "**MUST.** A thing is so.",
    body: [
      "**MUST.** A thing is so.",
      "",
      "Why: because.",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "Exception: not on Tuesdays.",
      "Checked by: `npm test`.",
      "Serves: PRN-04.",
    ],
  });

  assert.equal(parts.why, "because.");
  assert.deepEqual(parts.exceptions, ["not on Tuesdays."]);
  assert.equal(parts.checkedBy, "`npm test`.");
  assert.equal(parts.serves, "PRN-04.");
  // The table is the rule's own body and keeps its place.
  assert.ok(parts.body.some((line) => line.startsWith("| A")));
});

test("a labelled line inside a fence is not a label", () => {
  const parts = splitRule({
    statement: "**MUST.** A thing is so.",
    body: ["**MUST.** A thing is so.", "", "```markdown", "Why: this is a specimen.", "```"],
  });
  assert.equal(parts.why, "");
  assert.ok(parts.body.includes("Why: this is a specimen."));
});

// --- links out of a document written to be read in a repository ------------

test("a link to another guideline becomes its page; anything else becomes the file on GitHub", () => {
  const href = linkRewriter({
    file: "docs/foundations/color.md",
    prefix: "../../",
    slugs: new Set(["foundations/theming", "foundations/color"]),
    repoUrl: "https://example.test/repo",
  });

  assert.equal(href("theming.md"), "../../guidelines/foundations/theming.html");
  assert.equal(href("../../tokens/README.md"), "https://example.test/repo/blob/master/tokens/README.md");
  assert.equal(href("https://figma.com/x"), "https://figma.com/x");
  assert.equal(href("#anchor"), "#anchor");
});

test("without a recorded repository a repository link is left alone rather than invented", () => {
  const href = linkRewriter({ file: "docs/foundations/color.md", prefix: "", slugs: new Set(), repoUrl: null });
  assert.equal(href("../../tokens/README.md"), "../../tokens/README.md");
});

test("a cited ID becomes a link, and one in a code span or a tag does not", () => {
  const urlFor = (id) => (id === "PRN-04" ? "principles.html#PRN-04" : null);

  assert.equal(
    linkCitations("<p>Serves: PRN-04.</p>", urlFor),
    '<p>Serves: <a class="cite" href="principles.html#PRN-04">PRN-04</a>.</p>'
  );
  // A specimen, not a citation — the reading validate-rules.mjs takes.
  assert.equal(linkCitations("<p><code>PRN-04</code></p>", urlFor), "<p><code>PRN-04</code></p>");
  // An ID inside an attribute is not text. This is the bug the tag branch exists for.
  assert.equal(linkCitations('<section id="PRN-04">x</section>', urlFor), '<section id="PRN-04">x</section>');
  // An ID no rule carries stays plain rather than becoming a dead link.
  assert.equal(linkCitations("<p>FND-GONE-99</p>", urlFor), "<p>FND-GONE-99</p>");
});

// --- the pages -------------------------------------------------------------

test("every document gets a page, and every rule an anchor on it", () => {
  const pages = buildGuidelinePages(data, () => ({}));
  assert.equal(pages.size, data.files.length);

  for (const file of data.files) {
    const html = pages.get(`${file.slug}.html`);
    assert.ok(html, `${file.slug} has no page`);
    for (const rule of file.rules) {
      assert.ok(html.includes(`id="${rule.id}"`), `${file.slug} is missing an anchor for ${rule.id}`);
    }
  }
});

test("a file with no rules says so rather than rendering as an empty page", () => {
  const empty = data.files.find((file) => file.rules.length === 0);
  assert.ok(empty, "the set has a file with no rules");
  const html = renderPage(empty, data);
  assert.match(html, /Nothing is decided here yet/);
  assert.ok(empty.scope && html.includes(empty.scope.slice(0, 20)), "its scope line is still shown");
});

test("the prose between the rules is rendered, not only the rule blocks", () => {
  const color = data.files.find((file) => file.slug === "foundations/color");
  const html = renderPage(color, data);
  // The table of areas is prose in the document and is most of what the file says.
  assert.match(html, /the fill of something tangible/);
  assert.match(html, /<h2>How the roles are organised<\/h2>/);
});

test("the page header is not rendered a second time in the body", () => {
  const color = data.files.find((file) => file.slug === "foundations/color");
  const html = renderPage(color, data);
  assert.equal(html.match(/Status: Confirmed/g), null);
});

test("the index carries every file and the tally that makes readiness legible", () => {
  const html = renderIndex(data);
  for (const file of data.files) assert.ok(html.includes(`guidelines/${file.slug}.html`), file.slug);
  assert.ok(html.includes(`>${data.totals.rules}<`));
  assert.ok(html.includes(`>${data.totals.empty}<`));
});

test("the pages carry no script", () => {
  const pages = buildGuidelinePages(data, () => ({}));
  for (const [name, html] of pages) assert.ok(!/<script/.test(html), `${name} has a script`);
  assert.ok(!/<script/.test(renderIndex(data)));
});
