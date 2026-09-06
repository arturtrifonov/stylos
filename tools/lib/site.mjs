// The site's derived facts — SPEC 0011 §2.
//
// The front page presents the system as designed and marks what does not exist
// yet as Planned. Every one of those marks is computed here, from the
// repository, at build time: a project step flips a badge at the next
// `npm run build`, and the page is never edited to match reality. Nothing in
// this file is a fact of its own — each function names the record it reads.
//
// Every read is absent-safe. A missing file, field or table drops the element
// it feeds rather than failing the build or inventing a value — the posture
// readPlan takes, for the same reason: a fixture without the file is the
// ordinary case in tests, and a tree built from a partial checkout should be
// a smaller tree, not a broken one.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { rowsUnder } from "./plan.mjs";
import { builtComponents } from "../build-ui-types.mjs";

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * The Stylos Figma libraries, from the table in figma/README.md — the one
 * place the file keys are written down. A row whose Contents cell says
 * **external** is someone else's library (the interim icon set) and is
 * excluded: the site links what Stylos publishes, not what it consumes.
 *
 * @returns {{name: string, key: string, url: string, contents: string}[]}
 */
export function figmaLibraries(root) {
  const file = path.join(root, "figma/README.md");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split("\n");
  const header = lines.findIndex((line) => /^\|\s*File\s*\|\s*Key\s*\|\s*Contents\s*\|/.test(line));
  if (header === -1) return [];

  return rowsUnder(lines, header)
    .filter((cells) => cells.length >= 3)
    .map((cells) => {
      const link = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)/);
      return {
        name: link ? link[1] : cells[0],
        url: link ? link[2] : "",
        key: cells[1].replace(/`/g, ""),
        contents: cells[2],
      };
    })
    .filter((row) => row.url && !/\*\*external\*\*/.test(row.contents));
}

/** `@stylos/ui` as npm would meet it. `private: true` is what Planned means. */
export function packageFacts(root) {
  const pkg = readJson(path.join(root, "packages/ui/package.json"));
  if (!pkg) return null;
  return { name: pkg.name, version: pkg.version, private: pkg.private === true };
}

/**
 * A spec's status from the table in docs/specs/README.md — "Built", "Open",
 * or null when the spec has no row. Drives the Planned mark on everything
 * SPEC 0010 Part B delivers: when its row moves to Built, the badges go.
 */
export function specStatus(root, number) {
  const file = path.join(root, "docs/specs/README.md");
  if (!existsSync(file)) return null;
  const lines = readFileSync(file, "utf8").split("\n");
  const header = lines.findIndex((line) => /^\|\s*#\s*\|\s*Title\s*\|/.test(line));
  if (header === -1) return null;
  const row = rowsUnder(lines, header).find((cells) => cells[0]?.includes(number));
  return row ? row[row.length - 1] : null;
}

/** The repository's home, or null. No field, no link — never a hardcoded one. */
export function repoUrl(root) {
  const url = readJson(path.join(root, "package.json"))?.repository?.url;
  return typeof url === "string" ? url.replace(/\.git$/, "") : null;
}

/** Whether the workshop is built and can be copied into the tree. */
export function hasStorybook(root) {
  return existsSync(path.join(root, "apps/workshop/storybook-static/index.html"));
}

/** The system's one version line (ARCHITECTURE.md §9), for the hero pill. */
export function systemVersion(root) {
  const version = readJson(path.join(root, "package.json"))?.version;
  return typeof version === "string" ? version : null;
}

/**
 * Everything the front page derives, in one read. `entries` (the loaded
 * registry) is optional: with it, `inCode` counts the components implemented
 * in `packages/ui/src/`; without it — a fixture, a partial checkout — the
 * count is null and the tally omits it.
 */
export function siteFacts(root, entries = null) {
  const figma = figmaLibraries(root);
  return {
    inCode: entries ? builtComponents(root, entries).length : null,
    figma,
    // The header's one Figma link is the designer's entry point — the
    // components library when the table names one, the first row otherwise.
    figmaMain: (figma.find((row) => /components/i.test(row.name)) ?? figma[0])?.url ?? null,
    npm: packageFacts(root),
    repo: repoUrl(root),
    storybook: hasStorybook(root),
    version: systemVersion(root),
    distribution: specStatus(root, "0010") === "Built" ? "built" : "planned",
  };
}
