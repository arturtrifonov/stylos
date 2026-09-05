import test from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { checkLibraryVersion } from "./check-tokens.mjs";

// The published Figma library states its version in one variable, and the
// export that records it is manual. This is the check that a forgotten bump
// stops being invisible — see SPEC 0006 §6.

function root({ system = "0.1.0", library = undefined } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "stylos-check-"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ version: system }), "utf8");
  if (library !== undefined) {
    mkdirSync(path.join(dir, "figma"), { recursive: true });
    writeFileSync(path.join(dir, "figma/library.yaml"), library, "utf8");
  }
  return dir;
}

function check(options) {
  const problems = { errors: [], warnings: [] };
  checkLibraryVersion(root(options), problems);
  return problems;
}

test("passes when the library reported the version the repository is on", () => {
  const problems = check({ system: "0.1.0", library: 'version: "0.1.0"\nimported_at: "2026-09-05"\n' });
  assert.deepEqual(problems.errors, []);
  assert.deepEqual(problems.warnings, []);
});

test("fails when the library reported a different version, naming both", () => {
  const problems = check({ system: "0.2.0", library: 'version: "0.1.0"\n' });
  assert.deepEqual(problems.warnings, []);
  assert.match(problems.errors.join("\n"), /reported version "0\.1\.0"[\s\S]*system is "0\.2\.0"/);
});

test("fails a record carrying no version rather than reading absence as agreement", () => {
  assert.match(check({ library: 'imported_at: "2026-09-05"\n' }).errors.join("\n"), /carries no version/);
});

// Before the Meta collection exists there is nothing to disagree with. That is
// a gap to close, not a contradiction — so it warns, and --strict fails on it.
test("warns, and does not fail, when the marker has never been imported", () => {
  const problems = check({});
  assert.deepEqual(problems.errors, []);
  assert.match(problems.warnings.join("\n"), /figma\/library\.yaml does not exist/);
});
