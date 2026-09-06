import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { figmaLibraries, packageFacts, specStatus, repoUrl, hasStorybook, systemVersion, siteFacts } from "./site.mjs";

/** A throwaway repository holding only the files a test writes into it. */
function fixture(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-site-"));
  for (const [relative, contents] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, contents);
  }
  test.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

const FIGMA_README = `# figma/

| File | Key | Contents |
| --- | --- | --- |
| [Stylos / Styles](https://www.figma.com/design/aaa/Stylos--Styles) | \`aaa\` | variables and styles |
| [Stylos / Components](https://www.figma.com/design/bbb/Stylos--Components) | \`bbb\` | component definitions |
| [Default Kit / Material Icons](https://www.figma.com/design/ccc/Icons) | \`ccc\` | **external** — the icon source |

Text after the table.
`;

test("reads the libraries from the figma table and leaves the external row out", () => {
  const root = fixture({ "figma/README.md": FIGMA_README });
  const rows = figmaLibraries(root);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    name: "Stylos / Styles",
    url: "https://www.figma.com/design/aaa/Stylos--Styles",
    key: "aaa",
    contents: "variables and styles",
  });
  assert.ok(rows.every((row) => !/external/.test(row.contents)));
});

test("a missing file or table is an empty list, never an error", () => {
  assert.deepEqual(figmaLibraries(fixture()), []);
  assert.deepEqual(figmaLibraries(fixture({ "figma/README.md": "# figma/\n\nNo table here.\n" })), []);
});

test("private on the package is what Planned means", () => {
  const root = fixture({
    "packages/ui/package.json": JSON.stringify({ name: "@stylos/ui", version: "0.1.0", private: true }),
  });
  assert.deepEqual(packageFacts(root), { name: "@stylos/ui", version: "0.1.0", private: true });

  const published = fixture({
    "packages/ui/package.json": JSON.stringify({ name: "@stylos/ui", version: "1.0.0" }),
  });
  assert.equal(packageFacts(published).private, false);
  assert.equal(packageFacts(fixture()), null);
});

test("reads a spec's status from the specs table", () => {
  const root = fixture({
    "docs/specs/README.md": `# docs/specs/

| # | Title | Implements | Status |
| --- | --- | --- | --- |
| [0009](0009-x.md) | X | — | Open |
| [0010](0010-y.md) | Y | — | Built |
`,
  });
  assert.equal(specStatus(root, "0010"), "Built");
  assert.equal(specStatus(root, "0009"), "Open");
  assert.equal(specStatus(root, "0011"), null);
  assert.equal(specStatus(fixture(), "0010"), null);
});

test("the repository link comes from package.json and only from it", () => {
  const root = fixture({
    "package.json": JSON.stringify({ repository: { type: "git", url: "https://github.com/x/y.git" } }),
  });
  assert.equal(repoUrl(root), "https://github.com/x/y");
  assert.equal(repoUrl(fixture({ "package.json": "{}" })), null);
});

test("the version pill is the root package's version", () => {
  assert.equal(systemVersion(fixture({ "package.json": '{"version": "0.1.0"}' })), "0.1.0");
  assert.equal(systemVersion(fixture()), null);
});

test("the header's Figma link is the components library, not the first row", () => {
  const facts = siteFacts(fixture({ "figma/README.md": FIGMA_README }));
  assert.equal(facts.figmaMain, "https://www.figma.com/design/bbb/Stylos--Components");
  assert.equal(siteFacts(fixture()).figmaMain, null);
});

test("the storybook check is the built workshop's index and nothing subtler", () => {
  assert.equal(hasStorybook(fixture()), false);
  assert.equal(hasStorybook(fixture({ "apps/workshop/storybook-static/index.html": "<!doctype html>" })), true);
});
