// Test fixtures for the icon preset: a scratch manifest and a font stand-in.

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { MANIFEST } from "./icon-preset.mjs";

/** A scratch root carrying one manifest. */
export function scratchRoot(manifest = MANIFEST_TEXT) {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-icons-"));
  mkdirSync(path.join(root, path.dirname(MANIFEST)), { recursive: true });
  writeFileSync(path.join(root, MANIFEST), manifest);
  return root;
}

export const MANIFEST_TEXT = [
  "source:",
  '  family: "Material Symbols Rounded"',
  '  package: "material-symbols"',
  '  file: "material-symbols-rounded.woff2"',
  '  licence: "Apache-2.0"',
  "instance:",
  "  wght: 500",
  "  FILL: 1",
  "  GRAD: 0",
  "  opsz: 20",
  "registered:",
  '  - "chevron_right"',
  '  - "search"',
  "",
].join("\n");

/**
 * A font stand-in: names shape to a glyph id by position, and every outline is
 * a marker carrying the id and the transform it was asked for. Keeps the test
 * off the 5 MB packaged face — what is under test is the wiring, not fontkit.
 */
export function fakeFont(names, { shapesInto = 1 } = {}) {
  const ids = new Map(names.map((name, i) => [name, 100 + i]));
  return {
    lookup: {
      familyName: "Material Symbols Rounded",
      layout(name) {
        const id = ids.get(name);
        return { glyphs: id === undefined ? [] : Array.from({ length: shapesInto }, () => ({ id })) };
      },
    },
    instanced: {
      getGlyph(id) {
        return {
          path: {
            transform(...matrix) {
              return { toSVG: () => `M${id}.125 L${matrix.join(" ")}` };
            },
          },
        };
      },
    },
  };
}
