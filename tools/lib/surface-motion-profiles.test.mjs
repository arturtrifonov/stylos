import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadCanonical } from "./tokens.mjs";
import { loadSurfaceMotionProfile, validateSurfaceMotionProfile } from "./surface-motion-profiles.mjs";
import { buildCss } from "../build-css.mjs";
import { readNaming } from "../check-tokens.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const collections = loadCanonical(root);
const surfaceMotion = loadSurfaceMotionProfile(root);
const naming = readNaming(root);

test("all levels project explicit gap aliases and scales, including a floating level 5", () => {
  const { css, manifest, errors } = buildCss({ collections, naming, surfaceMotion });
  assert.deepEqual(errors, []);
  for (const { level, shift, scale } of surfaceMotion.layers) {
    const prefix = `--stylos-motion-surface-layer-${level}`;
    const token = `--stylos-${shift.replaceAll("/", "-")}`;
    assert.ok(css.includes(`${prefix}-shift: var(${token});`));
    assert.ok(css.includes(`${prefix}-scale: ${scale};`));
    assert.equal(manifest.properties[`${prefix}-scale`].source, "tokens/_surface-motion.yaml");
    assert.equal(manifest.properties[`${prefix}-shift`].rule, "FND-MOTION-19");
    assert.ok(!css.includes(`${prefix}-shift: calc(`), "no arithmetic changes the gap token");
  }
  assert.ok(css.includes("--stylos-motion-surface-layer-3-shift: var(--stylos-dimension-gap-g-2_000);"));
  assert.ok(css.includes("--stylos-motion-surface-layer-3-scale: 0.85;"));
  assert.ok(css.includes("--stylos-motion-surface-layer-5-shift: var(--stylos-dimension-gap-g-1_750);"));
  assert.ok(css.includes("--stylos-motion-surface-layer-5-scale: 0.75;"));
});

test("editing one profile does not recalculate other levels", () => {
  const changed = { ...surfaceMotion, layers: surfaceMotion.layers.map(entry =>
    entry.level === 3 ? { ...entry, shift: "dimension/gap/g-1_500", scale: 0.9 } : entry) };
  const { css, errors } = buildCss({ collections, naming, surfaceMotion: changed });
  assert.deepEqual(errors, []);
  assert.ok(css.includes("--stylos-motion-surface-layer-3-shift: var(--stylos-dimension-gap-g-1_500);"));
  assert.ok(css.includes("--stylos-motion-surface-layer-3-scale: 0.9;"));
  assert.ok(css.includes("--stylos-motion-surface-layer-2-scale: 0.9;"));
  assert.ok(css.includes("--stylos-motion-surface-layer-6-scale: 0.7;"));
});

test("invalid tokens, scales, missing/duplicate levels and moving flat profiles fail validation", () => {
  for (const change of [
    { shift: "dimension/gap/missing" }, { shift: "font/size/1_000" },
    { scale: 0 }, { scale: 1.1 }, { scale: NaN },
  ]) {
    const profile = { ...surfaceMotion, layers: surfaceMotion.layers.map(entry =>
      entry.level === 5 ? { ...entry, ...change } : entry) };
    assert.ok(validateSurfaceMotionProfile(profile, collections).length > 0);
    assert.ok(buildCss({ collections, naming, surfaceMotion: profile }).errors.length > 0);
  }
  for (const layers of [
    surfaceMotion.layers.filter(entry => entry.level !== 5),
    [...surfaceMotion.layers, surfaceMotion.layers[5]],
    surfaceMotion.layers.map(entry => entry.level === 0 ? { ...entry, scale: 0.9 } : entry),
    surfaceMotion.layers.map(entry => entry.level === 1 ? { ...entry, shift: "dimension/gap/g-1_000" } : entry),
  ]) {
    assert.ok(validateSurfaceMotionProfile({ ...surfaceMotion, layers }, collections).length > 0);
  }
});
