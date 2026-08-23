// Turns Figma's DTCG export into canonical token documents, and applies the
// checks that only mean anything while the exported data is in hand.
//
// The raw export is never stored: it is read once, at import, and what
// survives is tokens/*.yaml. Checks that need the raw floats — 8-bit
// representability, colour space — therefore run here and nowhere else. The
// alias contract is verified separately, against the canonical set, because
// `ref` and `values` are deliberately redundant and can check each other
// (ADR 0007 §5).

const SUPPORTED_COLOR_SPACES = new Set(["srgb"]);

// A component further than this from a multiple of 1/255 did not come from an
// 8-bit value. Anything closer is float32 representation noise.
const EIGHT_BIT_TOLERANCE = 1 / 4; // in units of 1/255
const ALPHA_TOLERANCE = 1 / 4; // in units of 1/1000

export const isColor = (value) =>
  value !== null && typeof value === "object" && "components" in value;

/**
 * Walk a DTCG document into an ordered Map of token path -> record. A node is
 * a leaf once it carries $type and $value; $extensions is metadata at every
 * level and is never a token.
 */
export function flattenDocument(document) {
  const tokens = new Map();

  const walk = (node, prefix) => {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$extensions") continue;
      if (value === null || typeof value !== "object") continue;

      const segments = [...prefix, key];
      if ("$type" in value && "$value" in value) {
        const extensions = value.$extensions ?? {};
        const alias = extensions["com.figma.aliasData"];
        tokens.set(segments.join("/"), {
          type: value.$type,
          value: value.$value,
          id: extensions["com.figma.variableId"] ?? null,
          scopes: extensions["com.figma.scopes"] ?? null,
          // Figma records what a variable is bound to. This is the alias
          // graph itself, straight from the file — not something to infer.
          alias: alias
            ? { collection: alias.targetVariableSetName, name: alias.targetVariableName }
            : null,
        });
      } else {
        walk(value, segments);
      }
    }
  };

  // Object.entries on a group whose children are all pure digits (palette hue
  // groups — the only such case in the data) enumerates them in ascending
  // numeric order rather than source order. Figma already writes them
  // ascending, so this is invisible, and it can only reorder siblings inside
  // one group — never change a value.
  walk(document, []);
  return tokens;
}

export function documentMode(document) {
  return document.$extensions?.["com.figma.modeName"] ?? null;
}

export function toHex(components) {
  return (
    "#" +
    components
      .map((c) => Math.min(255, Math.max(0, Math.round(c * 255))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function alphaOf(value) {
  return isColor(value) ? (value.alpha ?? 1) : 1;
}

/**
 * Checks that need the raw exported floats, so they can only run at import.
 * Colour space is a hard failure: hex is sRGB by definition, and the same
 * components in display-p3 are a different colour, so storing one as hex
 * would silently change it. Precision is a warning: 0.3/255 is imperceptible,
 * but it means someone typed a percentage in Figma rather than picking a
 * colour, and that is worth saying once.
 */
export function checkRawValues(collectionName, mode, tokens, problems) {
  for (const [tokenPath, record] of tokens) {
    if (!isColor(record.value)) continue;

    const space = record.value.colorSpace ?? "(unstated)";
    if (!SUPPORTED_COLOR_SPACES.has(space)) {
      problems.errors.push(
        `${collectionName}/${tokenPath} (${mode}): colour space "${space}" cannot be stored as ` +
          `hex — hex is sRGB by definition, and the same components in another space are a ` +
          `different colour. The canonical colour format needs revisiting before this can be ` +
          `imported — see ADR 0007 §6.`
      );
      continue;
    }

    const drift = Math.max(
      ...record.value.components.map((c) => Math.abs(c * 255 - Math.round(c * 255)))
    );
    if (drift > EIGHT_BIT_TOLERANCE) {
      problems.warnings.push(
        `${collectionName}/${tokenPath} (${mode}): ${toHex(record.value.components)} is not ` +
          `8-bit representable — drift of ${drift.toFixed(2)}/255. Fix the value in Figma, or ` +
          `accept the rounding.`
      );
    }

    const alpha = alphaOf(record.value);
    const alphaDrift = Math.abs(alpha - Math.round(alpha * 1000) / 1000) * 1000;
    if (alphaDrift > ALPHA_TOLERANCE) {
      problems.warnings.push(
        `${collectionName}/${tokenPath} (${mode}): alpha ${alpha} does not survive rounding to ` +
          `3 places — drift of ${alphaDrift.toFixed(2)}/1000.`
      );
    }
  }
}

/** Token names must be identical across a collection's modes. */
export function checkModeParity(collectionName, byMode, problems) {
  const modes = [...byMode.keys()];
  if (modes.length < 2) return;

  const [first, ...rest] = modes;
  const reference = new Set(byMode.get(first).keys());
  for (const mode of rest) {
    const other = new Set(byMode.get(mode).keys());
    const missing = [...reference].filter((p) => !other.has(p));
    const extra = [...other].filter((p) => !reference.has(p));
    if (missing.length || extra.length) {
      problems.errors.push(
        `${collectionName}: token names differ between modes "${first}" and "${mode}" — ` +
          `${missing.length} only in ${first} (${missing.slice(0, 3).join(", ")}…), ` +
          `${extra.length} only in ${mode} (${extra.slice(0, 3).join(", ")}…). ` +
          `A renamed token must be renamed in every mode.`
      );
    }
  }
}

/**
 * Build one canonical collection document.
 *
 * A token that Figma binds to another variable stores its **reference and
 * nothing else**. The resolved value is not written beside it: it is a
 * derived fact, and a stored copy of a derived fact is a cache that goes
 * stale. Following the reference is how a value is obtained.
 *
 * `id` is stored per mode where the modes hold different variables, which is
 * the case for palette: its two modes come from two Figma collections.
 */
export function buildCollectionDocument({ name, layer, byMode, refs, imported, figma }) {
  const modes = [...byMode.keys()];

  const provenance = new Map();
  if (imported) provenance.set("imported", imported);
  if (figma?.file) provenance.set("figma_file", figma.file);
  if (figma?.key) provenance.set("figma_key", figma.key);

  const document = new Map([
    ["collection", name],
    ["layer", layer],
  ]);
  if (provenance.size) document.set("source", provenance);
  document.set("modes", modes);

  const tokens = new Map();
  for (const [tokenPath, first] of byMode.get(modes[0])) {
    const entry = new Map([["type", first.type]]);

    // One id per mode where they differ. They do for palette: its two modes
    // come from two Figma collections, so they are different variables that
    // share a name. Within one Figma collection every mode is the same
    // variable, so a single id covers it.
    const ids = new Map();
    for (const mode of modes) {
      const id = byMode.get(mode).get(tokenPath)?.id;
      if (id) ids.set(mode, id);
    }
    if (ids.size) {
      const distinct = new Set(ids.values());
      entry.set("id", distinct.size === 1 ? [...distinct][0] : ids);
    }

    if (first.scopes?.length) entry.set("scopes", [...first.scopes]);

    // Per-mode reference, exactly as Figma records it.
    const perMode = new Map();
    for (const mode of modes) {
      const target = refs?.get(tokenPath)?.get(mode);
      if (target) perMode.set(mode, target);
    }

    if (perMode.size === modes.length) {
      const distinct = new Set(perMode.values());
      entry.set(
        "ref",
        distinct.size === 1 ? new Map([["default", [...distinct][0]]]) : perMode
      );
    } else {
      // A literal: the value is the token. Figma cannot bind a variable and
      // change its opacity, so a translucent colour arrives as a literal —
      // it is taken as given, not second-guessed against the palette.
      const values = new Map();
      const alphas = new Map();
      for (const mode of modes) {
        const record = byMode.get(mode).get(tokenPath);
        if (!record) continue;
        if (isColor(record.value)) {
          values.set(mode, toHex(record.value.components));
          const alpha = alphaOf(record.value);
          if (alpha !== 1) alphas.set(mode, Math.round(alpha * 1000) / 1000);
        } else {
          values.set(mode, record.value);
        }
      }
      entry.set("values", values);
      if (alphas.size) entry.set("alpha", alphas);
    }

    tokens.set(tokenPath, entry);
  }

  document.set("tokens", tokens);
  return document;
}
