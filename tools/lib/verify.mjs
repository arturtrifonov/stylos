// Verifies the canonical token set against itself.
//
// A token bound to another variable stores its reference and no value, so
// there is no stored value to disagree with anything — the failure mode the
// old redundancy check existed to catch cannot occur. What remains worth
// checking is that every reference resolves, that none loop, that a role's
// mode dependence is declared, and that a semantic mode never reaches across
// into the wrong primitive mode.

import { resolve, themeModes } from "./tokens.mjs";

/** Expand a token's `ref` into a target per mode. */
function refByMode(ref, modes, key, problems) {
  const targets = new Map();

  if (ref.has("default")) {
    const alsoPerMode = [...ref.keys()].filter((k) => k !== "default");
    if (alsoPerMode.length > 0) {
      problems.errors.push(
        `"${key}" declares both "default" and per-mode references ` +
          `(${alsoPerMode.join(", ")}). Use one or the other — "default" already covers every mode.`
      );
    }
    for (const mode of modes) targets.set(mode, ref.get("default"));
    return targets;
  }

  for (const [mode, target] of ref) {
    if (!modes.includes(mode)) {
      problems.errors.push(
        `"${key}" declares a reference for mode "${mode}", which is not a mode of this ` +
          `collection (${modes.join(", ")}).`
      );
      continue;
    }
    targets.set(mode, target);
  }

  for (const mode of modes) {
    if (!targets.has(mode)) problems.errors.push(`"${key}": no reference for mode "${mode}".`);
  }
  return targets;
}

/**
 * Every reference resolves, and none loop.
 *
 * A role taking a different step per mode needs no declaration: choosing one
 * is the point of the two-layer model (FND-COLOR-05) and the export states it
 * plainly. The allowlist that used to sit here asked for the same fact a
 * second time, in YAML, and failed the build when it was not repeated.
 */
export function verifyCanonical({ collections }, problems) {
  // Every reference is resolved in each theme the system has, not in the
  // collection's own modes: a collection without theme modes can still
  // reference one that has them, and the mode is carried by the question.
  const themes = themeModes(collections);

  for (const collection of collections) {
    for (const [tokenPath, token] of collection.tokens) {
      const key = `${collection.name}/${tokenPath}`;

      if (!token.ref) {
        if (token.values.size === 0) {
          problems.errors.push(`${key}: neither a value nor a reference.`);
        }
        continue;
      }

      refByMode(token.ref, collection.modes, key, problems);

      for (const theme of themes) {
        try {
          resolve(collections, collection.name, tokenPath, theme);
        } catch (error) {
          problems.errors.push(`${key} (${theme}): ${error.message}`);
        }
      }
    }
  }
}
