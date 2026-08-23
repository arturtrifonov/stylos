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
 * Every reference resolves, none loop, and mode dependence is declared in
 * both directions.
 */
export function verifyCanonical({ collections, modeDependent }, problems) {
  const declaredModeDependent = new Set(modeDependent);
  const matched = new Set();
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
        if (declaredModeDependent.has(key)) {
          matched.add(key);
          problems.errors.push(
            `tokens/_naming.yaml: mode_dependent lists "${key}", which holds a literal value ` +
              `rather than a reference. Remove it.`
          );
        }
        continue;
      }

      const targets = refByMode(token.ref, collection.modes, key, problems);

      for (const theme of themes) {
        try {
          resolve(collections, collection.name, tokenPath, theme);
        } catch (error) {
          problems.errors.push(`${key} (${theme}): ${error.message}`);
        }
      }

      const distinct = new Set(targets.values());
      const isModeDependent = distinct.size > 1;
      const isDeclared = declaredModeDependent.has(key);
      if (isDeclared) matched.add(key);

      if (isModeDependent && !isDeclared) {
        problems.errors.push(
          `tokens/_naming.yaml: "${key}" references a different token per mode ` +
            `(${[...targets].map(([m, t]) => `${m}: ${t}`).join(", ")}) but is not listed under ` +
            `mode_dependent. Add it there, or correct the binding in Figma.`
        );
      }
      if (!isModeDependent && isDeclared) {
        problems.errors.push(
          `tokens/_naming.yaml: "${key}" is listed under mode_dependent but references ` +
            `"${[...distinct][0]}" in every mode. Remove it — a stale entry silently weakens ` +
            `the check for every other role.`
        );
      }
    }
  }

  for (const key of declaredModeDependent) {
    if (!matched.has(key)) {
      problems.errors.push(
        `tokens/_naming.yaml: mode_dependent lists "${key}", which is not a token in any ` +
          `collection. Remove it, or fix the name.`
      );
    }
  }
}
