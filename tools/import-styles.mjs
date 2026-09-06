#!/usr/bin/env node
// Reads a dump of the Figma text styles and writes figma/text-styles.yaml —
// this repository's record of the Styles that Variables exports cannot carry.
// Decided in-session, 2026-09-06.
//
//   node tools/import-styles.mjs styles-dump.json
//   node tools/import-styles.mjs styles-dump.json --dry-run
//
// Figma has no export for Styles, so the dump comes from a Plugin API read
// (via the Figma MCP `use_figma` tool, or any plugin) with this shape per
// text style — the bound variable name per property, the style's raw values
// for cross-checking, the text case and the width axis:
//
//   { "read": "…Z", "figma_file": "…", "figma_key": "…",
//     "text_styles": [ { "name": "text/normal/medium",
//       "bound": { "fontFamily": "family/normal", "fontWeight": "weight/base",
//                  "fontSize": "size/1_000", "lineHeight": "line height/text/1_000",
//                  "letterSpacing": "letter spacing/style/normal",
//                  "paragraphSpacing": "paragraph spacing/1_125" },
//       "textCase": "ORIGINAL", "width": 100,
//       "raw": { "fontSize": 16, "lineHeight": 24, "letterSpacing": 0,
//                "paragraphSpacing": 9, "family": "Georama", "weight": 400 } } ],
//     "avatar_styles": ["avatars/01", …] }
//
// The record stores aliases into the `font` collection, never raw values —
// the same reason documentation does not carry copied token values
// (docs/foundations/effects.md). The dump's raw values are used once, here,
// to cross-check that each alias resolves to the value the style actually
// renders, then discarded like a variables export.
//
// A binding that does not resolve in tokens/font.yaml is recorded under
// `unresolved` rather than dropped or invented — the record tells the truth
// about Figma, and the CSS builder refuses to project a style that carries
// one. Effect styles are deliberately not recorded: shadow/elevation 1–6
// follow the composition rule in docs/foundations/effects.md exactly
// (verified against the live styles, 2026-09-06), and the rule is the
// record; focus/* are out of scope by decision. Avatar paint styles are
// image fills — the images live under assets/avatars/, exported at 256×256;
// the record keeps only the style names.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stringify } from "./lib/yaml.mjs";
import { loadCanonical, resolve } from "./lib/tokens.mjs";

export const OUT_FILE = "figma/text-styles.yaml";

/** The house yaml serializer takes Maps; plain objects convert recursively. */
function toMap(value) {
  if (Array.isArray(value)) return value.map(toMap);
  if (value !== null && typeof value === "object") {
    return new Map(Object.entries(value).map(([k, v]) => [k, toMap(v)]));
  }
  return value;
}

/** The style properties a text style binds, in record order. */
const PROPERTIES = [
  ["fontFamily", "font family", "family"],
  ["fontWeight", "font weight", "weight"],
  ["fontSize", "font size", "fontSize"],
  ["lineHeight", "line height", "lineHeight"],
  ["letterSpacing", "letter spacing", "letterSpacing"],
  ["paragraphSpacing", "paragraph spacing", "paragraphSpacing"],
];

/**
 * Builds the record document from a dump, resolving every binding against
 * the canonical `font` collection. Returns { document, report } — report
 * lines name every unresolved binding and every value mismatch; both are
 * judgement for a person, not repaired here.
 */
export function buildStylesDocument(dump, collections) {
  const report = [];
  const styles = {};

  for (const style of dump.text_styles) {
    const entry = {};
    const unresolved = [];

    for (const [dumpKey, recordKey, rawKey] of PROPERTIES) {
      const alias = style.bound[dumpKey];
      if (alias === undefined) continue;
      let resolved;
      try {
        resolved = resolve(collections, "font", alias, "default");
      } catch {
        resolved = undefined;
      }
      if (resolved === undefined) {
        unresolved.push(`${recordKey}: font/${alias}`);
        report.push(`${style.name}: ${recordKey} binds "font/${alias}", which does not resolve`);
        continue;
      }
      entry[recordKey] = `font/${alias}`;

      const raw = style.raw?.[rawKey];
      if (raw !== undefined && String(resolved.value) !== String(raw)) {
        report.push(
          `${style.name}: ${recordKey} resolves font/${alias} to ${resolved.value}, ` +
            `but the style renders ${raw}`
        );
      }
    }

    entry["text case"] = style.textCase === "UPPER" ? "uppercase" : "original";
    if (style.width && style.width !== 100) entry.width = style.width;
    if (unresolved.length > 0) entry.unresolved = unresolved;
    styles[style.name] = entry;
  }

  const document = {
    collection: "text styles",
    source: {
      read: dump.read,
      figma_file: dump.figma_file,
      figma_key: dump.figma_key,
    },
    styles,
    avatar_styles: dump.avatar_styles ?? [],
  };
  return { document, report };
}

/** Reads the dump, writes the record, returns { outPath, count, report }. */
export function importStyles(root, dumpPath, { dryRun = false } = {}) {
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const collections = loadCanonical(root);
  const { document, report } = buildStylesDocument(dump, collections);

  const text = stringify(toMap(document), {
    comments: [
      "GENERATED FILE — do not edit. Written by tools/import-styles.mjs from a Plugin API read.",
      `Read ${dump.read} from ${dump.figma_file}. Aliases into tokens/, never raw values.`,
    ],
  });
  const outPath = path.join(root, OUT_FILE);
  if (!dryRun) writeFileSync(outPath, text);
  return { outPath: OUT_FILE, count: Object.keys(document.styles).length, report };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dumpPath = args.find((a) => !a.startsWith("--"));
  if (!dumpPath) {
    console.error("usage: node tools/import-styles.mjs <dump.json> [--dry-run]");
    process.exit(1);
  }
  const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  const { outPath, count, report } = importStyles(root, dumpPath, { dryRun });
  for (const line of report) console.log(`report: ${line}`);
  console.log(
    `${dryRun ? "DRY RUN: would write" : "OK:"} ${count} text styles → ${outPath}` +
      (report.length ? ` — ${report.length} report(s), judgement not failure.` : "")
  );
}
