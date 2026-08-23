import test from "node:test";
import assert from "node:assert/strict";

import { checkCollectionIdentity } from "./import-tokens.mjs";

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
