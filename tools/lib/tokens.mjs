// Reads the canonical token set into memory. The one place that knows how
// tokens/*.yaml is shaped, so a consumer never re-implements YAML -> model.
//
// tools/tokens-report.mjs uses it today. The colour and accessibility viewer
// is meant to use the same loader rather than growing a second reader.
//
// This never reads figma/variables/exports/ — the canonical set is the
// contract, and the raw export is the normalizer's business alone (ADR 0007).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import { parse } from "./yaml.mjs";

/**
 * @typedef {object} Token
 * @property {string} type
 * @property {string|Map<string,string>|null} id   per mode where they differ
 * @property {string[]} scopes
 * @property {Map<string, string|number>} values     per mode; empty when the token has a ref
 * @property {Map<string, number>} alpha             per mode, only where < 1
 * @property {Map<string, string>|null} ref          per mode, or a single "default"
 */

/**
 * @typedef {object} Collection
 * @property {string} name
 * @property {string} layer
 * @property {string[]} modes
 * @property {{imported: string, figmaFile: string, figmaKey: string}} source
 * @property {Map<string, Token>} tokens
 */

export function listCanonical(root) {
  const dir = path.join(root, "tokens");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -".yaml".length))
    .sort();
}

function readCollection(root, name) {
  const file = path.join(root, "tokens", `${name}.yaml`);
  const document = parse(readFileSync(file, "utf8"), { filename: `tokens/${name}.yaml` });
  const source = document.get("source") ?? new Map();

  const tokens = new Map();
  for (const [tokenPath, entry] of document.get("tokens") ?? new Map()) {
    tokens.set(tokenPath, {
      type: entry.get("type"),
      id: entry.get("id") ?? null,
      scopes: entry.get("scopes") ?? [],
      values: entry.get("values") ?? new Map(),
      alpha: entry.get("alpha") ?? new Map(),
      ref: entry.get("ref") ?? null,
    });
  }

  return {
    name: document.get("collection") ?? name,
    layer: document.get("layer") ?? "primitive",
    modes: document.get("modes") ?? [],
    source: {
      imported: source.get("imported") ?? "",
      figmaFile: source.get("figma_file") ?? "",
      figmaKey: source.get("figma_key") ?? "",
    },
    tokens,
  };
}

/**
 * Load canonical collections. With no names, loads all of them in
 * alphabetical order; with names, loads exactly those in the order given.
 *
 * @returns {Collection[]}
 */
export function loadCanonical(root, names = []) {
  const available = listCanonical(root);

  if (available.length === 0) {
    throw new Error(
      `No canonical tokens found under tokens/. Generate them first: npm run tokens:normalize`
    );
  }

  const wanted = names.length > 0 ? names : available;
  const unknown = wanted.filter((n) => !available.includes(n));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown collection${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. ` +
        `Available: ${available.join(", ")}`
    );
  }

  return wanted.map((name) => readCollection(root, name));
}

/**
 * Group token paths by their first segment, preserving order within a group.
 * A token with no `/` has no prefix; those share one group keyed `null`, so a
 * flat collection like `radius` renders as one table rather than seven.
 */
export function groupByPrefix(tokens) {
  const groups = new Map();
  for (const [tokenPath, token] of tokens) {
    const slash = tokenPath.indexOf("/");
    const prefix = slash === -1 ? null : tokenPath.slice(0, slash);
    if (!groups.has(prefix)) groups.set(prefix, new Map());
    groups.get(prefix).set(tokenPath, token);
  }
  return groups;
}

/**
 * The theme modes the system actually has. `default` is not a mode — it means
 * "does not vary by theme", so a collection carrying only `default` is not
 * offering a choice.
 */
export function themeModes(collections) {
  const modes = new Set();
  for (const c of collections) for (const m of c.modes) if (m !== "default") modes.add(m);
  return modes.size ? [...modes] : ["default"];
}

/**
 * Follow a token's reference to the value it stands for, in a given theme mode.
 *
 * A token with a `ref` stores no value of its own — the value is whatever the
 * reference resolves to, which is the point: there is no second copy to go
 * stale. References chain, and the mode is carried by the *question*, not by
 * the token: `effect/shadow/color/base` does not vary by theme itself, but
 * what it points at does, so asking for it in dark mode resolves
 * `effect -> color/shadow/base -> dark -> palette/base/white`.
 *
 * An `alpha` on any hop multiplies into the result, which is how a colour
 * reused at reduced opacity keeps its link to the palette.
 *
 * @returns {{value: string|number, alpha: number, chain: string[]}}
 * @throws if a reference does not resolve, or the chain loops
 */
export function resolve(collections, collectionName, tokenPath, mode) {
  const byName =
    collections instanceof Map ? collections : new Map(collections.map((c) => [c.name, c]));
  const chain = [];
  let alpha = 1;
  let name = collectionName;
  let p = tokenPath;

  for (let hop = 0; hop < 16; hop++) {
    const collection = byName.get(name);
    if (!collection) throw new Error(`no collection "${name}"`);
    const token = collection.tokens.get(p);
    if (!token) throw new Error(`"${name}/${p}" does not exist`);

    const step = `${name}/${p}`;
    if (chain.includes(step)) throw new Error(`reference loop: ${[...chain, step].join(" -> ")}`);
    chain.push(step);

    // A collection without this mode does not vary by it, so its single set
    // of values answers for every mode.
    const own = collection.modes.includes(mode) ? mode : collection.modes[0];

    const alphaHere = token.alpha.get(own);
    if (alphaHere !== undefined) alpha *= alphaHere;

    if (!token.ref) return { value: token.values.get(own), alpha, chain };

    // Prefer a reference for the mode asked about; `default` means the same
    // target whatever the mode.
    const target = token.ref.get(mode) ?? token.ref.get("default");
    if (target === undefined) {
      throw new Error(`"${step}" has no reference for mode "${mode}"`);
    }

    const slash = target.indexOf("/");
    name = target.slice(0, slash);
    p = target.slice(slash + 1);
  }
  throw new Error(`reference chain too deep from ${collectionName}/${tokenPath}`);
}
