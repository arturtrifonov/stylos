#!/usr/bin/env node
// Reads a Figma variable export and writes the canonical token set.
//
//   npm run tokens:import -- --collection color "Light Mode.tokens.json" "Dark Mode.tokens.json"
//   npm run tokens:import -- --collection radius radius.json --dry-run
//
// The exported files are read and discarded. Nothing raw is stored: what
// survives is tokens/*.yaml, which is the record. An earlier design kept the
// export committed under figma/variables/exports/ as "immutable evidence" —
// that was withdrawn. A directory filled one collection at a time is not an
// export of anything: no such combination ever existed in Figma at any single
// moment, and checks anchored to it were verifying a contract against a stale
// composite. Figma is the source of truth; tokens/*.yaml is this repository's
// record of it; nothing in between earns a place in git.
//
// Nothing here is discovered and nothing is inferred. You name the collection
// you are updating and hand it the files; the name must be one declared in
// tokens/_naming.yaml, and the modes inside the files must be exactly the ones
// declared for it.
//
// Source filenames are ignored entirely: Figma names a file after its mode,
// not its collection, so a full refresh downloads five files called
// "Mode 1.tokens.json". The mode comes from inside the document.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stringify, parse } from "./lib/yaml.mjs";
import { loadCanonical, listCanonical } from "./lib/tokens.mjs";
import {
  flattenDocument,
  documentMode,
  checkRawValues,
  checkModeParity,
  buildCollectionDocument,
} from "./lib/convert.mjs";
import { verifyCanonical } from "./lib/verify.mjs";
import { readNaming } from "./check-tokens.mjs";

const USAGE = `Usage:
  node tools/import-tokens.mjs --collection <name> <file...> [--collection <name> <file...>] [--dry-run]

Every collection is named explicitly and its files handed over directly.
Run with no arguments to see the collections declared in tokens/_naming.yaml.`;

function parseArgv(argv) {
  const groups = [];
  const options = { dryRun: false, allowNewIds: false };
  let current = null;

  for (const arg of argv) {
    if (arg === "--collection") {
      current = null;
      groups.push((current = { name: null, files: [] }));
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--allow-new-ids") {
      options.allowNewIds = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option "${arg}"`);
    } else if (!current) {
      throw new Error(`"${arg}" came before any --collection`);
    } else if (current.name === null) {
      current.name = arg;
    } else {
      current.files.push(arg);
    }
  }

  for (const g of groups) {
    if (!g.name) throw new Error("--collection needs a collection name");
    if (g.files.length === 0) throw new Error(`--collection ${g.name} was given no files`);
  }
  return { groups, options };
}

/** Every Figma collection declared in _naming.yaml, with its expected modes. */
function declaredFigmaCollections(naming) {
  const declared = new Map();
  for (const [canonical, spec] of naming.get("collections")) {
    for (const [canonicalMode, source] of spec.get("modes")) {
      const from = source.get("from");
      if (!declared.has(from)) declared.set(from, new Map());
      declared.get(from).set(source.get("mode"), { canonical, canonicalMode });
    }
  }
  return declared;
}

/** Read and validate one collection's files. Throws with an actionable message. */
function readCollectionFiles(group, expected) {
  const documents = new Map();

  for (const file of group.files) {
    if (!existsSync(file)) throw new Error(`${file}: no such file`);

    const raw = readFileSync(file, "utf8");
    if (!raw.includes("com.figma.variableId")) {
      throw new Error(
        `${file}: not a Figma variable export — no token in it carries ` +
          `$extensions."com.figma.variableId". Export the collection from Figma and pass that file.`
      );
    }

    let document;
    try {
      document = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${file}: not valid JSON — ${error.message}`);
    }

    const mode = documentMode(document);
    if (!mode) {
      throw new Error(
        `${file}: no $extensions."com.figma.modeName" at the document root, so the mode this ` +
          `file holds cannot be established. The filename is not trusted for this.`
      );
    }
    if (documents.has(mode)) {
      throw new Error(`${group.name}: two files both claim to be mode "${mode}".`);
    }

    documents.set(mode, flattenDocument(document));
  }

  const found = new Set(documents.keys());
  const missing = [...expected.keys()].filter((m) => !found.has(m));
  const extra = [...found].filter((m) => !expected.has(m));

  if (missing.length || extra.length) {
    throw new Error(
      `${group.name}: mode mismatch.\n` +
        `  declared in tokens/_naming.yaml: ${[...expected.keys()].join(", ")}\n` +
        `  found in the files given:        ${[...found].join(", ") || "none"}\n` +
        (missing.length ? `  missing: ${missing.join(", ")}\n` : "") +
        (extra.length ? `  unexpected: ${extra.join(", ")}\n` : "") +
        `  Pass every mode's file, or update the declaration if Figma changed.`
    );
  }

  return documents;
}

/**
 * Catch a file handed to the wrong collection.
 *
 * Figma names an export after its mode, not its collection, so five arrive as
 * "Mode 1.tokens.json" and three as "Value.tokens.json". The mode check cannot
 * tell them apart and filenames mean nothing, so without this, passing
 * radius's file under --collection font is accepted in silence — and swapping
 * the two palettes would invert light and dark across the whole system.
 *
 * Variable ids are stable and unique to a collection, and tokens/*.yaml keeps
 * them, so the check needs no raw export either.
 */
export function checkCollectionIdentity(staged, knownIds) {
  for (const [name, incoming] of staged) {
    const known = knownIds.get(name);
    if (!known || known.size === 0) continue;
    if (incoming.size === 0) continue;

    if ([...incoming].some((id) => known.has(id))) continue;

    let looksLike = null;
    for (const [other, otherIds] of knownIds) {
      if (other === name || otherIds.size === 0) continue;
      const overlap = [...incoming].filter((id) => otherIds.has(id)).length;
      if (overlap / incoming.size > 0.5) {
        looksLike = { other, overlap };
        break;
      }
    }

    throw new Error(
      `--collection ${name}: the files given share no variable id with the "${name}" ` +
        `already in tokens/.\n` +
        (looksLike
          ? `  ${looksLike.overlap} of ${incoming.size} ids belong to "${looksLike.other}" — ` +
            `the two files were probably swapped.\n`
          : `  None of the ${incoming.size} ids match any collection already imported.\n`) +
        `  Figma names an export after its mode, not its collection, so several arrive with ` +
        `the same filename. Check which file is which.\n` +
        `  If you genuinely rebuilt this collection in Figma and every variable is new, ` +
        `re-run with --allow-new-ids.`
    );
  }
}


/**
 * Turn Figma's own bindings into canonical references.
 *
 * `com.figma.aliasData` records exactly what each variable is bound to, so
 * the alias graph is read, never inferred. `_naming.yaml` says which canonical
 * collection and mode each Figma collection is, which is all that is needed
 * to rewrite `palette.light` into `palette` + mode `light`.
 *
 * **A reference must stay within its own mode**, where the target names one.
 * Figma allows a dark-mode variable to bind into `palette.light`, and the
 * 2026-08-22 export contains one such binding. It is harmless only because
 * `base/black` happens to be identical in both palettes — 4 of 288 steps are.
 * On any other step it would pull a light-palette colour into the dark theme
 * in silence. So it fails: the binding is wrong in Figma.
 *
 * A collection that carries its own modes (`color`) pins nothing, because the
 * reference names the collection, not a mode — the mode is carried by whoever
 * asks. `effect` has no theme modes of its own and may still reference
 * `color/shadow/base`, which does: asking for it in dark mode resolves
 * through `color`'s dark mode. That is a reference working correctly, not a
 * mode mismatch.
 */
function referencesFrom(canonical, byMode, figmaOf, problems) {
  const refs = new Map();

  for (const [mode, tokens] of byMode) {
    for (const [tokenPath, record] of tokens) {
      if (!record.alias) continue;

      const target = figmaOf.get(record.alias.collection);
      if (!target) {
        problems.errors.push(
          `${canonical}/${tokenPath} (${mode}) is bound to "${record.alias.name}" in ` +
            `"${record.alias.collection}", which tokens/_naming.yaml does not declare. ` +
            `Declare that collection, or correct the binding in Figma.`
        );
        continue;
      }

      // A Figma collection that stands for one canonical mode pins the mode,
      // and it must be this one.
      if (target.pinnedMode !== null && target.pinnedMode !== mode) {
        problems.errors.push(
          `${canonical}/${tokenPath} (${mode}) is bound to "${record.alias.name}" in ` +
            `"${record.alias.collection}", which is the "${target.pinnedMode}" mode of ` +
            `"${target.canonical}". A mode must reference its own mode — this pulls a ` +
            `${target.pinnedMode}-mode value into ${mode}. Fix the binding in Figma and ` +
            `export again.`
        );
        continue;
      }

      if (!refs.has(tokenPath)) refs.set(tokenPath, new Map());
      refs.get(tokenPath).set(mode, `${target.canonical}/${record.alias.name}`);
    }
  }

  return refs;
}

/** A line per import, so "when did font last change" has an answer. */
function appendHistory(root, stamp, entries) {
  const file = path.join(root, "tokens/_history.yaml");
  let imports = [];
  if (existsSync(file)) {
    try {
      imports = parse(readFileSync(file, "utf8"), { filename: "_history.yaml" }).get("imports") ?? [];
    } catch {
      imports = [];
    }
  }

  imports.unshift(
    new Map([
      ["at", stamp],
      ["collections", entries.map((e) => new Map(Object.entries(e)))],
    ])
  );

  writeFileSync(
    file,
    stringify(new Map([["imports", imports]]), {
      comments: [
        "GENERATED FILE — written by tools/import-tokens.mjs. Newest first.",
        "When each collection was last imported, and what it did. The values are in git.",
      ],
    }),
    "utf8"
  );
}

async function main(root, argv) {
  const naming = readNaming(root);
  const declared = declaredFigmaCollections(naming);
  const { groups, options } = parseArgv(argv);

  const listDeclared = () =>
    [...declared]
      .map(([n, modes]) => `  ${n}  (modes: ${[...modes.keys()].join(", ")})`)
      .join("\n");

  if (groups.length === 0) {
    throw new Error(`${USAGE}\n\nDeclared collections:\n${listDeclared()}`);
  }

  // Validate everything before writing anything.
  const staged = new Map();
  for (const group of groups) {
    if (!declared.has(group.name)) {
      throw new Error(
        `"${group.name}" is not a collection declared in tokens/_naming.yaml.\n` +
          `Declared collections:\n${listDeclared()}\n` +
          `If Figma really has a new collection, declare it there first.`
      );
    }
    if (staged.has(group.name)) {
      throw new Error(`"${group.name}" was given twice — pass all its files under one --collection.`);
    }
    staged.set(group.name, readCollectionFiles(group, declared.get(group.name)));
  }

  const existing = listCanonical(root).length > 0 ? loadCanonical(root) : [];
  const existingByName = new Map(existing.map((c) => [c.name, c]));

  if (!options.allowNewIds) {
    // Compare against the canonical collection each Figma collection feeds.
    // Every id the canonical collection holds, across all its modes — so
    // palette.light and palette.dark are each recognisable, even though both
    // feed one canonical collection.
    const knownIds = new Map();
    for (const [figmaName, modes] of declared) {
      const { canonical, canonicalMode } = [...modes.values()][0];
      const ids = new Set();
      for (const t of existingByName.get(canonical)?.tokens.values() ?? []) {
        if (typeof t.id === "string") ids.add(t.id);
        else if (t.id instanceof Map) {
          const own = t.id.get(canonicalMode);
          if (own) ids.add(own);
        }
      }
      knownIds.set(figmaName, ids);
    }
    const stagedIds = new Map(
      [...staged].map(([name, byMode]) => [
        name,
        new Set([...byMode.values()].flatMap((m) => [...m.values()].map((t) => t.id).filter(Boolean))),
      ])
    );
    checkCollectionIdentity(stagedIds, knownIds);
  }

  // Regroup by canonical collection: palette.light + palette.dark are one.
  const canonicalGroups = new Map();
  for (const [figmaName, byMode] of staged) {
    for (const [figmaMode, tokens] of byMode) {
      const { canonical, canonicalMode } = declared.get(figmaName).get(figmaMode);
      if (!canonicalGroups.has(canonical)) canonicalGroups.set(canonical, new Map());
      canonicalGroups.get(canonical).set(canonicalMode, tokens);
    }
  }

  // A canonical collection must be imported whole: importing palette.light
  // alone would leave the dark mode behind at a different moment in time.
  const problems = { errors: [], warnings: [] };
  for (const [canonical, byMode] of canonicalGroups) {
    const spec = naming.get("collections").get(canonical);
    const wanted = [...spec.get("modes").keys()];
    const missing = wanted.filter((m) => !byMode.has(m));
    if (missing.length) {
      const sources = wanted
        .map((m) => `${spec.get("modes").get(m).get("from")} (${m})`)
        .join(", ");
      throw new Error(
        `"${canonical}" has modes ${wanted.join(", ")} and must be imported whole — ` +
          `mode${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} missing.\n` +
          `  Pass every source for it: ${sources}\n` +
          `  Importing one mode alone would leave the others at a different moment in time.`
      );
    }
    // Order the modes as declared, not as given on the command line.
    canonicalGroups.set(canonical, new Map(wanted.map((m) => [m, byMode.get(m)])));
  }

  // For each Figma collection: which canonical collection it feeds, and —
  // when it feeds exactly one canonical mode — which. `palette.light` is
  // pinned to the light mode; `color` carries two modes of its own, so a
  // reference to it names no particular mode.
  const figmaOf = new Map();
  for (const [figmaName, modes] of declared) {
    const targets = [...modes.values()];
    const canonicalModes = new Set(targets.map((t) => t.canonicalMode));
    figmaOf.set(figmaName, {
      canonical: targets[0].canonical,
      pinnedMode: canonicalModes.size === 1 ? [...canonicalModes][0] : null,
    });
  }

  const refsByCollection = new Map();
  for (const [canonical, byMode] of canonicalGroups) {
    checkModeParity(canonical, byMode, problems);
    for (const [mode, tokens] of byMode) checkRawValues(canonical, mode, tokens, problems);
    refsByCollection.set(canonical, referencesFrom(canonical, byMode, figmaOf, problems));
  }

  for (const warning of problems.warnings) console.error(`WARN  ${warning}`);
  if (problems.errors.length) {
    for (const error of problems.errors) console.error(`FAIL  ${error}`);
    return 1;
  }

  const source = naming.get("source") ?? new Map();
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + "Z";

  const report = [];
  const documents = new Map();
  for (const [canonical, byMode] of canonicalGroups) {
    const refs = refsByCollection.get(canonical);
    const document = buildCollectionDocument({
      name: canonical,
      // A collection is semantic when its tokens are bound to others.
      layer: refs.size > 0 ? "semantic" : "primitive",
      byMode,
      refs,
      imported: stamp,
      figma: { file: source.get("file"), key: source.get("key") },
    });
    documents.set(canonical, document);

    const before = existingByName.get(canonical);
    const count = document.get("tokens").size;
    const status = !before
      ? "new"
      : sameValues(before, document)
        ? "unchanged"
        : "changed";
    report.push({ collection: canonical, tokens: count, status });
    console.error(`  ${canonical}  ${count} tokens  ${status}`);
  }

  if (options.dryRun) {
    console.error(`\nDry run — nothing written.`);
    return 0;
  }

  mkdirSync(path.join(root, "tokens"), { recursive: true });
  for (const [canonical, document] of documents) {
    writeFileSync(
      path.join(root, "tokens", `${canonical}.yaml`),
      stringify(document, {
        comments: [
          "GENERATED FILE — do not edit. Written by tools/import-tokens.mjs from a Figma export.",
          `Imported ${stamp} from ${source.get("file") ?? "Figma"}.`,
        ],
      }),
      "utf8"
    );
  }
  appendHistory(root, stamp, report);

  // Verify the whole canonical set, not just what was imported: a change in
  // one collection can break an alias declared in another.
  console.error("");
  const after = { errors: [], warnings: [] };
  const written = loadCanonical(root);

  verifyCanonical(
    { collections: written, modeDependent: naming.get("mode_dependent") ?? [] },
    after
  );
  for (const error of after.errors) console.error(`FAIL  ${error}`);

  if (after.errors.length) {
    console.error(
      `\nImported, but the canonical set no longer verifies. tokens/*.yaml was written — it is ` +
        `what Figma produced. Fix the inputs above and re-run: npm run tokens:check`
    );
    return 1;
  }

  console.error(`OK: ${documents.size} collection(s) imported, alias contract holds.`);
  return 0;
}

/** Do two canonical documents say the same thing? Provenance aside. */
function sameValues(before, document) {
  const tokens = document.get("tokens");
  if (before.tokens.size !== tokens.size) return false;

  const flat = (map) => [...(map ?? new Map())].map(([k, v]) => `${k}=${v}`).join(",");

  for (const [p, entry] of tokens) {
    const old = before.tokens.get(p);
    if (!old) return false;
    if (flat(entry.get("values")) !== flat(old.values)) return false;
    if (flat(entry.get("alpha")) !== flat(old.alpha)) return false;
    if (flat(entry.get("ref")) !== flat(old.ref)) return false;
  }
  return true;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  try {
    process.exit(await main(root, process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
