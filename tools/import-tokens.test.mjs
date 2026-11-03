import test from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  checkCollectionIdentity,
  checkWithdrawals,
  dropSpecialRoles,
  parseArgv,
  withdrawnBy,
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

// --- Special roles (FND-COLOR-14) ------------------------------------------
//
// The family is generated from tokens/_special.yaml, so an export's copy of it
// is dropped rather than recorded, and a generated role survives any import.

test("a generated role is not withdrawn by an export that lacks it", () => {
  const before = new Map([collection("color", ["text/base", "text/special/violet"])]);
  const generated = new Map([["color", new Set(["text/special/violet"])]]);
  assert.deepEqual(withdrawnBy(before, incoming("color", ["text/base"]), generated), []);
  assert.deepEqual(withdrawnBy(before, incoming("color", ["text/base"])), ["color/text/special/violet"]);
});

const generatedRole = (light, dark) => ({ ref: new Map([["light", light], ["dark", dark]]) });

test("drops every special role from the export and reports where Figma diverges", () => {
  const record = (name) => ({ alias: { collection: "palette.light", name } });
  const byMode = new Map([
    ["light", new Map([
      ["text/base", record("slate/950")],
      ["text/special/violet", record("violet/700")],
      ["surface/special/violet", record("violet/700")],
    ])],
    ["dark", new Map([
      ["text/base", record("slate/950")],
      ["text/special/violet", record("violet/700")],
      ["surface/special/violet", record("violet/700")],
    ])],
  ]);
  const generated = new Map([["text/special/violet", generatedRole("palette/violet/700", "palette/violet/800")]]);

  const { dropped, notes } = dropSpecialRoles(byMode, generated);

  assert.equal(dropped, 2);
  assert.deepEqual([...byMode.get("light").keys()], ["text/base"]);
  assert.deepEqual([...byMode.get("dark").keys()], ["text/base"]);
  assert.match(notes.join("\n"), /1 special variable\(s\) the generated family does not: surface\/special\/violet/);
  assert.match(notes.join("\n"), /text\/special\/violet \(dark\): Figma palette\/violet\/700, generated palette\/violet\/800/);
});

test("says nothing when Figma's special roles agree with the generated ones", () => {
  const byMode = new Map([
    ["light", new Map([["text/special/violet", { alias: { name: "violet/700" } }]])],
    ["dark", new Map([["text/special/violet", { alias: { name: "violet/800" } }]])],
  ]);
  const generated = new Map([["text/special/violet", generatedRole("palette/violet/700", "palette/violet/800")]]);
  assert.deepEqual(dropSpecialRoles(byMode, generated).notes, []);
});
