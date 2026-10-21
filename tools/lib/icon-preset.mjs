// Draws the Stylos icon preset out of the Material Symbols variable font at one
// fixed instance (docs/foundations/icons.md).
//
// The whole catalogue is drawn — every name the pinned font package declares —
// so a consumer can use any mark without asking for it to be added. Drawing
// all of it takes about a second, so it happens in the build rather than in a
// separate import step, and nothing it produces is committed: the instance is
// recorded in assets/icons/manifest.yaml and the font is pinned by
// package-lock.json, which together reproduce every drawing.
//
// Why the font is the source rather than @material-symbols/svg-NNN: the stock
// SVG packages are drawn at opsz 48 and GRAD 0 only, and the chosen instance is
// opsz 20. Optical size is a redrawing, not a scale, so the difference is not
// recoverable downstream — it has to come off the variable font.
//
// Three devDependencies, against tools/README.md's dependency-free norm, and
// the exception is recorded there: instancing a variable font and reading a
// glyph outline is not something plain Node can do.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { parse } from "./yaml.mjs";

export const MANIFEST = "assets/icons/manifest.yaml";

// The upstream convention, kept so a Stylos icon and a stock Material Symbols
// icon are the same drawing in the same box: the font's 960-unit em, y flipped
// so the baseline-up outline reads as a top-down SVG.
export const VIEW_BOX = "0 -960 960 960";
export const UPEM = 960;

/** Path coordinates, to two decimals — 960 units against a 16–48px render. */
export function roundPath(d) {
  return d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 100) / 100));
}

/** Reads the manifest into the shape the drawing needs. */
export function readManifest(root) {
  const doc = parse(readFileSync(path.join(root, MANIFEST), "utf8"), { filename: MANIFEST });

  const source = doc.get("source");
  const instance = doc.get("instance");
  const registered = doc.get("registered");
  if (!source || !instance || !registered) {
    throw new Error(`${MANIFEST}: needs source, instance and registered`);
  }

  const seen = new Set();
  for (const name of registered) {
    if (seen.has(name)) throw new Error(`${MANIFEST}: "${name}" is listed twice`);
    seen.add(name);
  }

  return {
    file: source.get("file"),
    package: source.get("package"),
    family: source.get("family"),
    instance: Object.fromEntries(instance),
    registered,
  };
}

/** Where the pinned font package is installed, wherever node_modules is. */
export function packageDir(manifest) {
  const require = createRequire(import.meta.url);
  return path.dirname(require.resolve(`${manifest.package}/package.json`));
}

/**
 * Every name the package declares, in its own order. The package's type
 * declaration is the catalogue it publishes; a name in it that the face does
 * not shape into one glyph is skipped when drawing, and reported.
 */
export function catalogueNames(manifest, { read = (file) => readFileSync(file, "utf8") } = {}) {
  const text = read(path.join(packageDir(manifest), "index.d.ts"));
  const names = [];
  for (const [, name] of text.matchAll(/"([a-z0-9_]+)"/g)) if (!names.includes(name)) names.push(name);
  if (names.length === 0) throw new Error(`${manifest.package}/index.d.ts declares no icon names`);
  return names;
}

/**
 * Opens the packaged variable font at one instance. fontkit's getVariation
 * cannot read a WOFF2 — it re-parses the compressed stream and finds no table
 * directory — so the face is decompressed to TrueType in memory first.
 * Returns { lookup, instanced }: ligatures are shaped on the base face, because
 * the variation object has no cmap, and outlines come off the instanced one.
 */
export async function openFont(manifest) {
  const [{ default: woff2 }, fontkit] = await Promise.all([import("wawoff2"), import("fontkit")]);

  const woff2Path = path.join(packageDir(manifest), manifest.file);
  const ttf = Buffer.from(await woff2.decompress(readFileSync(woff2Path)));

  const lookup = fontkit.create(ttf);
  const instanced = lookup.getVariation(manifest.instance);
  return { lookup, instanced };
}

/** The single glyph a ligature name resolves to. Anything else is an error. */
export function glyphIdFor(lookup, name) {
  const run = lookup.layout(name);
  if (run.glyphs.length !== 1) {
    throw new Error(
      `"${name}" is not one glyph in ${lookup.familyName} — ` +
        `it shaped into ${run.glyphs.length}. Check the name against the Material Symbols catalogue.`
    );
  }
  return run.glyphs[0].id;
}

/** One drawing: the box and a single outline. */
export function drawIcon(font, name) {
  const glyph = font.instanced.getGlyph(glyphIdFor(font.lookup, name));
  // y up in a font, y down in SVG — flipped here rather than by a transform
  // on the element, so the drawing is inert geometry a sprite can also carry.
  const d = roundPath(glyph.path.transform(1, 0, 0, -1, 0, 0).toSVG());
  return { viewBox: VIEW_BOX, paths: [{ d }] };
}

/**
 * Draws the preset. `catalogue` is every declared name that shapes into one
 * glyph, plus the manifest's registered names, which must all resolve — the
 * components render those without being asked, so a blank one is a bug.
 *
 * @returns {Promise<{manifest: object, catalogue: Map<string, object>, skipped: string[]}>}
 */
export async function drawPreset(root, { open = openFont, names = catalogueNames } = {}) {
  const manifest = readManifest(root);
  const font = await open(manifest);

  const catalogue = new Map();
  const skipped = [];
  for (const name of names(manifest)) {
    try {
      catalogue.set(name, drawIcon(font, name));
    } catch {
      skipped.push(name);
    }
  }

  // Drawn again on its own, so a registered name that does not resolve stops
  // the build with the reason rather than joining the skipped list.
  for (const name of manifest.registered) {
    if (!catalogue.has(name)) catalogue.set(name, drawIcon(font, name));
  }
  return { manifest, catalogue, skipped: skipped.filter((name) => !catalogue.has(name)) };
}

/** The registered drawings only, keyed by name, in manifest order. */
export async function drawRegistered(root, options) {
  const { manifest, catalogue } = await drawPreset(root, {
    ...options,
    names: (manifest) => manifest.registered,
  });
  return new Map(manifest.registered.map((name) => [name, catalogue.get(name)]));
}
