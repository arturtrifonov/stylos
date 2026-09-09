import test from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkRules, parseDocument, citations, topicOf, ID } from "./validate-rules.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

// The fixtures are guideline documents each wrong in exactly one way — see
// tools/tests/rules/README.md. A fixture stands in for the file its rules
// claim to be in, so the topic is declared here rather than derived from the
// fixture's own name.
function fixture(name, { file = "docs/behavior/focus.md", area = "BEH", topic = "FOCUS" } = {}) {
  return {
    file,
    area,
    topic,
    header: true,
    text: readFileSync(path.join(here, "tests/rules", name), "utf8"),
  };
}

function check(documents, options = {}) {
  return checkRules({ documents, ...options });
}

test("passes a document whose rules follow the grammar", () => {
  const result = check([fixture("valid.md")]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("fails two rules claiming one id, naming the first", () => {
  const result = check([fixture("duplicate-id.md")]);
  assert.match(
    result.errors.join("\n"),
    /duplicate id "BEH-FOCUS-01", already declared by docs\/behavior\/focus\.md:6/
  );
  assert.equal(result.ok, false);
});

test("fails an id whose topic is not the file's", () => {
  const result = check([fixture("wrong-topic.md")]);
  assert.match(result.errors.join("\n"), /claims topic KEYBOARD, but this file is FOCUS/);
  assert.equal(result.ok, false);
});

test("fails a statement that does not open with a level", () => {
  const result = check([fixture("missing-level.md")]);
  assert.match(result.errors.join("\n"), /does not open with a level/);
  assert.equal(result.ok, false);
});

test("fails a citation no rule carries", () => {
  const document = fixture("dangling-citation.md", {
    file: "docs/behavior/overlays.md",
    topic: "OVERLAYS",
  });
  const result = check([document], { sources: [document] });
  assert.match(result.errors.join("\n"), /cites "BEH-FOCUS-09", which no rule carries/);
  assert.equal(result.ok, false);
});

test("passes a citation of a rule another document carries", () => {
  const overlays = fixture("dangling-citation.md", {
    file: "docs/behavior/overlays.md",
    topic: "OVERLAYS",
  });
  const focus = {
    ...fixture("valid.md"),
    text: fixture("valid.md").text.replace("BEH-FOCUS-03", "BEH-FOCUS-09"),
  };
  const result = check([focus, overlays], { sources: [overlays] });
  assert.deepEqual(result.errors, []);
});

test("fails an area that is not the file's", () => {
  const result = check([fixture("valid.md", { file: "docs/patterns/forms.md", area: "PAT", topic: "FORMS" })]);
  assert.match(result.errors.join("\n"), /is a BEH rule in a PAT file/);
});

test("fails a topic segment on a single-file area — the grammar refuses it", () => {
  const document = {
    file: "docs/RULES.md",
    area: "RUL",
    topic: null,
    header: true,
    text: "# Rules\n\nStatus: Confirmed\nScope: one line.\n\n### RUL-RULES-01 — A rule has an ID\n\n**MUST.** Every rule carries an ID.\n\nWhy: because.\n",
  };
  assert.match(check([document]).errors.join("\n"), /"RUL-RULES-01" is not a rule ID/);
});

test("fails a heading that meant to be an ID and is not one", () => {
  const document = {
    file: "docs/behavior/focus.md",
    area: "BEH",
    topic: "FOCUS",
    header: true,
    text: "# Focus\n\nStatus: Partial\nScope: one line.\n\n### BEH-FOCUS-3 — Focus returns\n\n**MUST.** It returns.\n\nWhy: because.\n",
  };
  assert.match(check([document]).errors.join("\n"), /"BEH-FOCUS-3" is not a rule ID/);
});

test("fails a rule with no reasoning", () => {
  const document = {
    file: "docs/behavior/focus.md",
    area: "BEH",
    topic: "FOCUS",
    header: true,
    text: "# Focus\n\nStatus: Partial\nScope: one line.\n\n### BEH-FOCUS-01 — Focus returns\n\n**MUST.** It returns.\n",
  };
  assert.match(check([document]).errors.join("\n"), /has no "Why:" paragraph/);
});

test("fails a status outside the vocabulary, and a file with no scope", () => {
  const document = {
    file: "docs/content/voice.md",
    area: "CNT",
    topic: "VOICE",
    header: true,
    text: "# Voice\n\nStatus: draft\n",
  };
  const errors = check([document]).errors.join("\n");
  assert.match(errors, /status "draft" is not one of Yet to fill, Partial, Confirmed/);
  assert.match(errors, /no "Scope:" line/);
});

test("reads the header only above the first section — a later Status: line is prose", () => {
  const document = {
    file: "docs/content/voice.md",
    area: "CNT",
    topic: "VOICE",
    header: true,
    text: "# Voice\n\n## How a component records one\n\nStatus: Confirmed\nScope: not this file's.\n",
  };
  const errors = check([document]).errors.join("\n");
  assert.match(errors, /no "Status:" line/);
  assert.match(errors, /no "Scope:" line/);
});

test("does not require the header on a document that is not a guideline file", () => {
  const document = {
    file: "docs/components/STANDARD.md",
    area: "STD",
    topic: null,
    header: false,
    text: "# Standard\n\n## What a contract carries\n\n### STD-01 — Every property carries a description\n\n**MUST.** A property with no description is not documented.\n\nWhy: the page renders the description, and an empty cell reads as a component nobody wrote up.\n",
  };
  assert.deepEqual(check([document]).errors, []);
});

test("reads a rule block through a fenced example without counting the specimen", () => {
  const parsed = parseDocument(
    "# Rules\n\nStatus: Confirmed\nScope: one line.\n\n### RUL-01 — A rule has an ID\n\n**MUST.** Every rule carries an ID.\n\n```markdown\n### BEH-FOCUS-03 — Focus returns to the invoker\n\n**MUST.** Focus returns.\n```\n\nWhy: because.\n"
  );
  assert.deepEqual(parsed.rules.map((rule) => rule.id), ["RUL-01"]);
  assert.equal(parsed.rules[0].level, "MUST");
  assert.equal(parsed.rules[0].why, true);
});

test("a rule block ends at the next heading of level 3 or higher", () => {
  const parsed = parseDocument(
    "# Focus\n\nStatus: Partial\nScope: one line.\n\n### BEH-FOCUS-01 — Visible\n\n**MUST.** It is visible.\n\n#### A detail\n\nStill inside the rule.\n\n## Open\n\nWhy: this line is outside the rule.\n"
  );
  assert.equal(parsed.rules.length, 1);
  assert.equal(parsed.rules[0].why, false);
});

test("an ID in a fence or a code span is a specimen, not a citation", () => {
  const found = citations(
    "See BEH-FOCUS-01 and `BEH-FOCUS-02`.\n\n```\nBEH-FOCUS-03\n```\n\n### BEH-FOCUS-04 — a heading\n"
  );
  assert.deepEqual(found.map((one) => one.id), ["BEH-FOCUS-01"]);
});

test("a source that is not Markdown is scanned whole", () => {
  const found = citations("// implements BEH-FOCUS-01\n", { markdown: false });
  assert.deepEqual(found.map((one) => one.id), ["BEH-FOCUS-01"]);
});

test("an index that disagrees with a file fails, in both directions", () => {
  const documents = [
    {
      file: "docs/content/voice.md",
      area: "CNT",
      topic: "VOICE",
      header: true,
      text: "# Voice\n\nStatus: Yet to fill\nScope: one line.\n",
    },
    {
      file: "docs/content/labels.md",
      area: "CNT",
      topic: "LABELS",
      header: true,
      text: "# Labels\n\nStatus: Yet to fill\nScope: one line.\n",
    },
  ];
  const index = {
    file: "docs/content/README.md",
    dir: "docs/content",
    text: "| File | Status |\n| --- | --- |\n| [voice.md](voice.md) | Confirmed |\n| [tone.md](tone.md) | Yet to fill |\n",
  };
  const errors = check(documents, { indexes: [index] }).errors.join("\n");
  assert.match(errors, /lists voice\.md as "Confirmed", the file says "Yet to fill"/);
  assert.match(errors, /does not list labels\.md/);
  assert.match(errors, /lists tone\.md, which is not a file in this directory/);
});

test("reports a Confirmed file carrying no rule, and a rule naming no check", () => {
  const documents = [
    {
      file: "docs/foundations/color.md",
      area: "FND",
      topic: "COLOR",
      header: true,
      text: "# Color\n\nStatus: Confirmed\nScope: one line.\n",
    },
    fixture("valid.md"),
  ];
  const reports = check(documents).reports.join("\n");
  assert.match(reports, /docs\/foundations\/color\.md is Confirmed and carries no rule block/);
  assert.match(reports, /docs\/behavior\/focus\.md: 1 of 2 rules name no check/);
});

test("the topic is the file's stem, hyphens kept", () => {
  assert.equal(topicOf("text-input.md"), "TEXT-INPUT");
  assert.equal(topicOf("docs/behavior/focus.md"), "FOCUS");
});

test("the grammar takes the two ID shapes and nothing else", () => {
  for (const id of ["RUL-01", "PRN-99", "STD-07", "FND-COLOR-01", "BEH-TEXT-INPUT-12"]) {
    assert.equal(ID.test(id), true, id);
  }
  for (const id of ["RUL-COLOR-01", "FND-01", "BEH-FOCUS-1", "beh-focus-01", "XXX-FOCUS-01"]) {
    assert.equal(ID.test(id), false, id);
  }
});
