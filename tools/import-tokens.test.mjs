import test from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  checkCollectionIdentity,
  checkWithdrawals,
  metaDeclaration,
  parseArgv,
  readLibraryVersion,
  withdrawnBy,
  writeLibraryRecord,
} from "./import-tokens.mjs";
import { parse } from "./lib/yaml.mjs";

// Figma names an export after its mode, so five collections all download as
// "Mode 1.tokens.json" and three as "Value.tokens.json". Nothing in the file
// says which collection it came from except the variable ids, so those are
// compared against the ids already stored in tokens/*.yaml.
const staged = (name, ids) => new Map([[name, new Set(ids)]]);

const known = new Map([
  ["font", new Set(["v:1", "v:2", "v:3"])],
  ["radius", new Set(["v:10", "v:11"])],
  ["border", new Set(["v:20"])],
]);

test("accepts a file whose ids match the collection it claims to be", () => {
  assert.doesNotThrow(() =>
    checkCollectionIdentity(staged("font", ["v:1", "v:2", "v:3"]), known)
  );
});

test("accepts partial overlap — tokens get added and removed between exports", () => {
  assert.doesNotThrow(() =>
    checkCollectionIdentity(staged("font", ["v:1", "v:2", "v:99"]), known)
  );
});

test("rejects a file swapped with another collection, naming that collection", () => {
  assert.throws(
    () => checkCollectionIdentity(staged("font", ["v:10", "v:11"]), known),
    { message: /2 of 2 ids belong to "radius" — the two files were probably swapped/ }
  );
});

test("rejects a file belonging to nothing known, without guessing", () => {
  assert.throws(
    () => checkCollectionIdentity(staged("font", ["v:900", "v:901"]), known),
    { message: /None of the 2 ids match any collection already imported/ }
  );
});

test("points at the canonical set, and at the escape hatch", () => {
  assert.throws(
    () => checkCollectionIdentity(staged("font", ["v:10", "v:11"]), known),
    { message: /already in tokens\/[\s\S]*--allow-new-ids/ }
  );
});

test("says nothing about a collection not yet imported", () => {
  assert.doesNotThrow(() =>
    checkCollectionIdentity(staged("effect", ["v:500"]), known)
  );
});

test("accepts a multi-mode collection whose ids are pooled across its modes", () => {
  const twoModes = new Map([["color", new Set(["v:31", "v:32"])]]);
  const known = new Map([["color", new Set(["v:31", "v:32"])]]);

  assert.doesNotThrow(() => checkCollectionIdentity(twoModes, known));
});

// --- The library version marker (SPEC 0006 §6) -----------------------------
//
// `Meta` is a Figma collection carrying one STRING variable and no tokens. It
// goes to figma/library.yaml, never to tokens/, and every way the export can
// be wrong has to say so rather than record something plausible.

const meta = { from: "Meta", mode: "Mode 1", variable: "version" };

const metaExport = (value, { mode = "Mode 1", name = "version" } = {}) =>
  JSON.stringify({
    $extensions: { "com.figma.modeName": mode },
    [name]: {
      $type: "string",
      $value: value,
      $extensions: { "com.figma.variableId": "VariableID:1:1" },
    },
  });

function withExport(text, run) {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "stylos-meta-")), "Meta.tokens.json");
  writeFileSync(file, text, "utf8");
  return run({ name: "Meta", files: [file] });
}

test("reads the version out of a Meta export", () => {
  assert.equal(withExport(metaExport("0.1.0"), (g) => readLibraryVersion(g, meta)), "0.1.0");
});

test("trims the version, because a variable is typed by hand", () => {
  assert.equal(withExport(metaExport("  0.2.0 "), (g) => readLibraryVersion(g, meta)), "0.2.0");
});

test("rejects an export made in a mode the declaration does not name", () => {
  assert.throws(
    () => withExport(metaExport("0.1.0", { mode: "Value" }), (g) => readLibraryVersion(g, meta)),
    { message: /this is mode "Value", and tokens\/_naming\.yaml declares "Meta" as mode "Mode 1"/ }
  );
});

test("rejects an export with no version variable in it", () => {
  assert.throws(
    () => withExport(metaExport("0.1.0", { name: "release" }), (g) => readLibraryVersion(g, meta)),
    { message: /no variable "version" in "Meta"/ }
  );
});

test("rejects a version that is not a string", () => {
  assert.throws(
    () => withExport(metaExport(1), (g) => readLibraryVersion(g, meta)),
    { message: /is 1, not a release string/ }
  );
});

test("takes one file, because it is one variable", () => {
  assert.throws(
    () => readLibraryVersion({ name: "Meta", files: ["a.json", "b.json"] }, meta),
    { message: /takes one file — it is a single variable/ }
  );
});

test("reads the declaration, and says nothing when none is made", () => {
  const naming = new Map([["meta", new Map(Object.entries(meta))]]);
  assert.deepEqual(metaDeclaration(naming), meta);
  assert.equal(metaDeclaration(new Map()), null);
});

test("writes figma/library.yaml as a generated file the checker can read", () => {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-lib-"));
  writeLibraryRecord(root, "0.1.0", "2026-09-05");

  const text = readFileSync(path.join(root, "figma/library.yaml"), "utf8");
  assert.match(text, /GENERATED FILE/);

  const record = parse(text, { filename: "figma/library.yaml" });
  assert.equal(record.get("version"), "0.1.0");
  assert.equal(record.get("imported_at"), "2026-09-05");
});

// --- Withdrawal (SPEC 0007 §6) ---------------------------------------------
//
// A token disappears at import, not at build: tokens/*.yaml is committed and
// is the record, so a withdrawal is a line vanishing from a committed file.
// The CSS build has no baseline to compare a run against and cannot catch it.

const collection = (name, paths) => [
  name,
  { name, tokens: new Map(paths.map((p) => [p, {}])) },
];

const existing = new Map([
  collection("radius", ["zero", "extra small", "small"]),
  collection("border", ["width/normal", "width/thick"]),
]);

/** One import of `name`, offering exactly these token paths, in one mode. */
const incoming = (name, paths) =>
  new Map([[name, new Map([["default", new Map(paths.map((p) => [p, {}]))]])]]);

test("says nothing when the import removes nothing", () => {
  assert.deepEqual(
    withdrawnBy(existing, incoming("radius", ["zero", "extra small", "small"])),
    []
  );
});

test("names what disappeared, with its canonical path", () => {
  assert.deepEqual(withdrawnBy(existing, incoming("radius", ["zero", "small"])), [
    "radius/extra small",
  ]);
});

test("looks only at the collections being imported", () => {
  assert.deepEqual(withdrawnBy(existing, incoming("border", ["width/normal", "width/thick"])), []);
});

test("says nothing about a collection imported for the first time", () => {
  assert.deepEqual(withdrawnBy(existing, incoming("font", ["size/1_000"])), []);
});

test("refuses an unacknowledged withdrawal, printing the flag to add", () => {
  assert.throws(() => checkWithdrawals(["radius/extra small"], []), {
    message:
      /This import removes 1 token[\s\S]*radius\/extra small[\s\S]*--withdraw "radius\/extra small"/,
  });
});

test("quotes a path with a space, so the printed command can be pasted", () => {
  assert.throws(() => checkWithdrawals(["radius/extra small", "radius/small"], []), {
    message: /--withdraw "radius\/extra small" --withdraw radius\/small/,
  });
});

test("suggests the export may be incomplete, because that is the likelier cause", () => {
  assert.throws(() => checkWithdrawals(["radius/small"], []), {
    message: /export is incomplete — export the collection whole/,
  });
});

test("lets an acknowledged withdrawal through", () => {
  assert.deepEqual(
    checkWithdrawals(["radius/extra small"], ["radius/extra small"]),
    ["radius/extra small"]
  );
});

test("needs one acknowledgement per token, not one for the batch", () => {
  assert.throws(() => checkWithdrawals(["radius/small", "radius/zero"], ["radius/small"]), {
    message: /This import removes 1 token[\s\S]*radius\/zero/,
  });
});

test("rejects the same acknowledgement twice", () => {
  assert.throws(() => checkWithdrawals(["radius/small"], ["radius/small", "radius/small"]), {
    message: /--withdraw radius\/small was given twice\. Once per token\./,
  });
});

// A stale --withdraw sitting in a shell history would silently cover the next
// real withdrawal, which is the same failure mode a stale `mode_dependent`
// entry has, and it is refused for the same reason.
test("rejects an acknowledgement for a token that is staying", () => {
  assert.throws(
    () => checkWithdrawals([], ["radius/small"], { known: new Set(["radius/small"]) }),
    { message: /not disappearing — it is in the export and stays[\s\S]*covers the next real withdrawal/ }
  );
});

test("says so plainly when the acknowledged path is not a token at all", () => {
  assert.throws(() => checkWithdrawals([], ["radius/enormous"], { known: new Set() }), {
    message: /no collection under tokens\/ has it/,
  });
});

test("--withdraw takes its value, and refuses to swallow the next option", () => {
  assert.deepEqual(parseArgv(["--withdraw", "radius/small"]).options.withdraw, ["radius/small"]);
  assert.throws(() => parseArgv(["--withdraw", "--dry-run"]), {
    message: /--withdraw needs the canonical path/,
  });
  assert.throws(() => parseArgv(["--withdraw"]), { message: /--withdraw needs the canonical path/ });
});

test("--withdraw does not become an input file of the --collection before it", () => {
  const { groups, options } = parseArgv([
    "--collection", "radius", "one.json",
    "--withdraw", "radius/extra small",
  ]);
  assert.deepEqual(groups, [{ name: "radius", files: ["one.json"] }]);
  assert.deepEqual(options.withdraw, ["radius/extra small"]);
});
