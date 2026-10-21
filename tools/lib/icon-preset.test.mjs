import test from "node:test";
import assert from "node:assert/strict";

import path from "node:path";

import {
  catalogueNames,
  drawIcon,
  drawPreset,
  drawRegistered,
  glyphIdFor,
  readManifest,
  roundPath,
  VIEW_BOX,
} from "./icon-preset.mjs";
import { MANIFEST_TEXT, fakeFont, scratchRoot } from "./icon-fixtures.mjs";

test("roundPath cuts coordinates to two decimals and leaves integers alone", () => {
  assert.equal(roundPath("M341 -669.5Q306 -454.333 312.25 -448.006"), "M341 -669.5Q306 -454.33 312.25 -448.01");
  assert.equal(roundPath("M480 -80L960 -960Z"), "M480 -80L960 -960Z");
  // The minus sign belongs to the number, not to the command before it.
  assert.equal(roundPath("L-12.349 -0.001"), "L-12.35 0");
});

test("readManifest reads the registered list in order and keeps the instance", () => {
  const manifest = readManifest(scratchRoot());

  assert.deepEqual(manifest.registered, ["chevron_right", "search"]);
  assert.deepEqual(manifest.instance, { wght: 500, FILL: 1, GRAD: 0, opsz: 20 });
  assert.equal(manifest.file, "material-symbols-rounded.woff2");
  assert.equal(manifest.package, "material-symbols");
  assert.equal(manifest.family, "Material Symbols Rounded");
});

test("readManifest rejects a name listed twice", () => {
  const root = scratchRoot(MANIFEST_TEXT.replace('  - "search"', '  - "chevron_right"'));
  assert.throws(() => readManifest(root), /"chevron_right" is listed twice/);
});

test("readManifest rejects a manifest missing a required section", () => {
  const root = scratchRoot(MANIFEST_TEXT.replace(/^instance:\n(?:  .*\n)+/m, ""));
  assert.throws(() => readManifest(root), /needs source, instance and registered/);
});

test("catalogueNames reads every declared name once, in the package's order", () => {
  const manifest = readManifest(scratchRoot());
  const names = catalogueNames(manifest, {
    read: () => 'type MaterialSymbols = [\n  "123",\n  "search",\n  "add",\n  "search"\n];',
  });
  assert.deepEqual(names, ["123", "search", "add"]);
  assert.throws(() => catalogueNames(manifest, { read: () => "" }), /declares no icon names/);
});

test("glyphIdFor refuses a name that is not exactly one glyph", () => {
  const names = ["chevron_right"];
  assert.equal(glyphIdFor(fakeFont(names).lookup, "chevron_right"), 100);
  assert.throws(
    () => glyphIdFor(fakeFont(names, { shapesInto: 2 }).lookup, "chevron_right"),
    /"chevron_right" is not one glyph .* it shaped into 2/s
  );
});

test("drawIcon flips y and rounds the outline into the upstream box", () => {
  assert.deepEqual(drawIcon(fakeFont(["search"]), "search"), {
    viewBox: VIEW_BOX,
    paths: [{ d: "M100.13 L1 0 0 -1 0 0" }],
  });
});

test("drawPreset draws the catalogue, skips what is not one glyph, and keeps registered names", async () => {
  const root = scratchRoot();
  const { catalogue, skipped } = await drawPreset(root, {
    open: () => fakeFont(["add", "chevron_right", "search"]),
    names: () => ["add", "okonomiyaki", "search"],
  });

  // chevron_right is not declared by the stand-in package but is registered,
  // so it is drawn anyway; okonomiyaki shapes into nothing and is skipped.
  assert.deepEqual([...catalogue.keys()], ["add", "search", "chevron_right"]);
  assert.deepEqual(skipped, ["okonomiyaki"]);
});

test("drawPreset fails on a registered name that does not resolve", async () => {
  await assert.rejects(
    drawPreset(scratchRoot(), { open: () => fakeFont(["search"]), names: () => ["search"] }),
    /"chevron_right" is not one glyph .* it shaped into 0/s
  );
});

test("drawRegistered draws only the registered marks, in manifest order", async () => {
  const drawn = await drawRegistered(scratchRoot(), { open: () => fakeFont(["search", "chevron_right"]) });
  assert.deepEqual([...drawn.keys()], ["chevron_right", "search"]);
});

test("the real manifest's registered marks all draw from the pinned font", async () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const drawn = await drawRegistered(root);

  assert.deepEqual([...drawn.keys()], readManifest(root).registered);
  for (const [name, drawing] of drawn) {
    assert.equal(drawing.viewBox, VIEW_BOX, name);
    assert.match(drawing.paths[0].d, /^M-?\d/, `${name} has an outline`);
  }
});
