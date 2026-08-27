// The join between a contract's `sizing_model` and `tokens/`.
//
// Every dimension and type measure in a contract is a token name, never a
// number (docs/components/registry/README.md). `box: 16` would be a copy of a
// value that lives in tokens/ and rots the first time the scale moves. So the
// contract records the address and everything downstream resolves it: the page
// at build time, the validator on every run.
//
// The field name says which collection to resolve against, because both
// `dimension` and `font` have a `size/` group and the names alone are
// ambiguous — `size/s-2_000` is a dimension, `size/0_750` is a font measure.
// This map is the whole of that knowledge and there is one copy of it.

import { loadCanonical, resolve } from "./tokens.mjs";

export const SIZING_TOKEN_FIELDS = new Map([
  ["box", "dimension"],
  ["gap", "dimension"],
  ["font_size", "font"],
  ["line_height", "font"],
]);

/** The mode these collections are imported with; neither varies by theme. */
const MODE = "default";

/**
 * A resolver over the canonical token set: `(field, name) => number | string`,
 * or `undefined` where the name addresses nothing. It reads `tokens/` once and
 * answers from memory, so a page with five sizes and four measures does not
 * re-parse eight YAML files twenty times.
 *
 * `undefined` rather than a throw, because both callers want to carry on: the
 * validator collects every unresolvable name rather than stopping at the first,
 * and the page is only ever built after the validator has been run.
 */
export function createTokenResolver(root) {
  const collections = loadCanonical(root);
  const cache = new Map();

  return (field, name) => {
    const collection = SIZING_TOKEN_FIELDS.get(field);
    if (!collection || typeof name !== "string") return undefined;

    const key = `${collection}/${name}`;
    if (cache.has(key)) return cache.get(key);

    let value;
    try {
      value = resolve(collections, collection, name, MODE).value;
    } catch {
      value = undefined;
    }
    cache.set(key, value);
    return value;
  };
}
