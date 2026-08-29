// Reads PLAN.md Stage 4 — the waves the v0.1 core set is worked in.
//
// The waves are the plan's, and the plan is where they stay. Everything that
// shows them reads them from here, so no page can claim an order PLAN.md has
// since changed, and nothing holds a second copy of the membership. That is
// the whole reason this file exists rather than a `wave:` field on the entry:
// a field would put the plan's sequence in a hundred files that are edited for
// entirely different reasons, and the two would part company the first week.
//
// `import.batch` used to play this role in the views and no longer does. It is
// Airtable's sequencing from the day of the import, which PLAN.md §4 states is
// history and not the queue — see docs/specs/0004-registry-reconciliation.md
// §3.4. Waves are the queue, so they are what an index offers facets for.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readiness } from "./registry.mjs";

/**
 * PLAN.md, or null. Absent is not an error: a view built without it omits
 * whatever it would have shown rather than falling back to an order of its own.
 */
export function readPlan(root) {
  const file = path.join(root, "PLAN.md");
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/**
 * The rows of the Stage 4 table, unresolved.
 *
 * It is a Markdown table written to be read by a person, so it is parsed as
 * one: the header names the columns, the rows end where the table ends.
 */
export function parseWaves(plan) {
  const lines = String(plan).split("\n");
  const header = lines.findIndex((line) => /^\|\s*#\s*\|\s*Wave\s*\|\s*Entries\s*\|/.test(line));
  if (header === -1) throw new Error("plan: PLAN.md has no wave table (| # | Wave | Entries |)");

  const waves = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 4) break;
    waves.push({
      number: Number(cells[0]),
      name: cells[1],
      tokens: cells[2].split(",").map((token) => token.trim()).filter(Boolean),
      endsWith: cells[3],
    });
  }
  if (waves.length === 0) throw new Error("plan: the wave table in PLAN.md has no rows");
  return waves;
}

/**
 * One token of the Entries column into the ids it names.
 *
 * Two forms, because the column is prose: a full id, and the family shorthand
 * `Radio Input / Label / Text`, where the first part is a full id and each part
 * after it is joined to that entry's `family`. A full id is tried first, so
 * `Table / TD Text` reads as itself rather than as a shorthand — the two use
 * the same punctuation and only the registry can tell them apart.
 *
 * A token resolving to nothing throws rather than being skipped. A wave quietly
 * one component short is a wrong percentage nobody would ever catch.
 */
function resolveToken(token, byId, where) {
  if (byId.has(token)) return [token];

  const parts = token.split(" / ");
  const base = parts[0];
  const entry = byId.get(base);
  if (parts.length > 1 && entry?.family) {
    return [base, ...parts.slice(1).map((part) => `${entry.family} ${part}`)];
  }

  throw new Error(
    `plan: PLAN.md ${where} names "${token}", which is no registry id ` +
      `and no "<id> / <sibling>" family shorthand`
  );
}

/**
 * The rows of the §9 table — everything after v0.1, grouped by what the group
 * unlocks. Deliberately not waves: PLAN.md §9 states it carries no order inside
 * a group, no estimate and no date, and calling these waves would say it did.
 */
export function parseGroups(plan) {
  const lines = String(plan).split("\n");
  const header = lines.findIndex((line) => /^\|\s*Group\s*\|\s*Unlocks\s*\|\s*Entries\s*\|/.test(line));
  if (header === -1) return [];

  const groups = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) break;
    groups.push({
      name: cells[0],
      unlocks: cells[1],
      tokens: cells[2].split(",").map((token) => token.trim()).filter(Boolean),
    });
  }
  return groups;
}

/** Every wave with the registry ids it covers, in the plan's order. */
export function waveMembers(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return parseWaves(plan).map((wave) => {
    const ids = wave.tokens.flatMap((token) => resolveToken(token, byId, `wave ${wave.number}`));
    for (const id of ids) {
      if (!byId.has(id)) {
        throw new Error(`plan: PLAN.md wave ${wave.number} names "${id}", which has no registry entry`);
      }
    }
    return { ...wave, ids };
  });
}

/** Every §9 group with the registry ids it covers, in the plan's order. */
export function groupMembers(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return parseGroups(plan).map((group) => {
    const ids = group.tokens.flatMap((token) => resolveToken(token, byId, `group "${group.name}"`));
    for (const id of ids) {
      if (!byId.has(id)) {
        throw new Error(`plan: PLAN.md group "${group.name}" names "${id}", which has no registry entry`);
      }
    }
    return { ...group, ids };
  });
}

/** `id → group name`, for everything §9 places. */
export function groupById(plan, entries) {
  const map = new Map();
  for (const group of groupMembers(plan, entries)) {
    for (const id of group.ids) map.set(id, group.name);
  }
  return map;
}

/**
 * Every id either table places. What is missing from it is an entry the plan
 * does not mention at all — which is the thing worth being told about, since a
 * queue that quietly covers part of the set is the failure both tables exist
 * to prevent.
 */
export function plannedIds(plan, entries) {
  return new Set([...waveById(plan, entries).keys(), ...groupById(plan, entries).keys()]);
}

/**
 * `id → wave number`, for everything in the core set. An entry outside it is
 * absent rather than zero: not being scheduled for v0.1 is not a position in
 * the order.
 */
export function waveById(plan, entries) {
  const map = new Map();
  for (const wave of waveMembers(plan, entries)) {
    for (const id of wave.ids) map.set(id, wave.number);
  }
  return map;
}

/** Each wave counted against its own size — the shape of the work and the progress through it. */
export function waveProgress(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return waveMembers(plan, entries).map((wave) => {
    const rows = wave.ids.map((id) => byId.get(id));
    const done = rows.filter((entry) => readiness(entry) === "ready").length;
    const started = rows.filter((entry) => readiness(entry) === "in progress").length;
    return {
      number: wave.number,
      name: wave.name,
      endsWith: wave.endsWith,
      total: rows.length,
      done,
      started,
      percent: Math.round((done / rows.length) * 100),
    };
  });
}
