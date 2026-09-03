// Reads the two tables in PLAN.md — §4 the waves, §9 the milestones.
//
// The vocabulary is ARCHITECTURE.md §8 and is not restated here. What matters
// to this file: a milestone is a decision about distribution and every entry
// carries exactly one; a wave is a unit of work and exists only where the
// horizon is close enough to cut one, so an entry with a milestone and no wave
// is unsequenced, not missing.
//
// Everything that shows either reads it from here, so no page can claim an
// order the plan has stopped stating, and nothing holds a second copy of the
// membership. That is the whole reason this file exists rather than a `wave:`
// or `milestone:` field on the entry: a field would put the plan's sequence in
// a hundred files that are edited for entirely different reasons, and the two
// would part company the first week.
//
// `import.batch` used to play this role in the views and no longer does. It is
// Airtable's sequencing from the day of the import, which PLAN.md §4 states is
// history and not the queue — see docs/specs/0004-registry-reconciliation.md
// §3.4 and docs/specs/0005-queue-in-the-views.md.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readiness } from "./registry.mjs";

/**
 * The milestone §4 is the checklist for. It has no row of its own in §9 —
 * listing its members there would be the same set written twice — so the two
 * tables meet here and nowhere else.
 */
export const CORE_MILESTONE = "0.1";

/**
 * PLAN.md, or null. Absent is not an error: a view built without it omits
 * whatever it would have shown rather than falling back to an order of its own.
 */
export function readPlan(root) {
  const file = path.join(root, "PLAN.md");
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/** The rows under a Markdown table header, as trimmed cells. */
function rowsUnder(lines, header) {
  const rows = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    rows.push(line.split("|").slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
}

/**
 * The rows of the §4 table, unresolved.
 *
 * It is a Markdown table written to be read by a person, so it is parsed as
 * one: the header names the columns, the rows end where the table ends.
 */
export function parseWaves(plan) {
  const lines = String(plan).split("\n");
  const header = lines.findIndex((line) => /^\|\s*#\s*\|\s*Wave\s*\|\s*Entries\s*\|/.test(line));
  if (header === -1) throw new Error("plan: PLAN.md has no wave table (| # | Wave | Entries |)");

  const waves = rowsUnder(lines, header)
    .filter((cells) => cells.length >= 4)
    .map((cells) => ({
      number: Number(cells[0]),
      name: cells[1],
      tokens: cells[2].split(",").map((token) => token.trim()).filter(Boolean),
      endsWith: cells[3],
    }));

  if (waves.length === 0) throw new Error("plan: the wave table in PLAN.md has no rows");
  return waves;
}

/**
 * The rows of the §9 table, unresolved — the milestones and the decision each
 * one opens.
 *
 * A plan with no milestone table throws rather than returning nothing. Reading
 * a renamed header as "there are no milestones" would empty a facet, a column
 * and a chart at once, and every one of them would look deliberate.
 */
export function parseMilestones(plan) {
  const lines = String(plan).split("\n");
  const header = lines.findIndex((line) =>
    /^\|\s*Milestone\s*\|\s*The decision it opens\s*\|\s*Entries\s*\|/.test(line)
  );
  if (header === -1) {
    const stale = lines.some((line) => /^\|\s*Group\s*\|\s*Unlocks\s*\|\s*Entries\s*\|/.test(line));
    throw new Error(
      "plan: PLAN.md has no milestone table (| Milestone | The decision it opens | Entries |)" +
        (stale ? " — §9 still carries the old Group / Unlocks header" : "")
    );
  }

  const milestones = rowsUnder(lines, header)
    .filter((cells) => cells.length >= 3)
    .map((cells) => ({
      name: cells[0],
      opens: cells[1],
      tokens: cells[2].split(",").map((token) => token.trim()).filter(Boolean),
    }));

  if (milestones.length === 0) throw new Error("plan: the milestone table in PLAN.md has no rows");
  return milestones;
}

/**
 * One token of an Entries column into the ids it names.
 *
 * Two forms, because the column is prose: a full id, and the family shorthand
 * `Radio Input / Label / Text`, where the first part is a full id and each part
 * after it is joined to that entry's `family`. A full id is tried first, so
 * an id that itself carries a `/` reads as itself rather than as a shorthand —
 * the two use the same punctuation and only the registry can tell them apart.
 * No entry carries one today (docs/foundations/naming.md §2), so the shorthand
 * is the only live reading; the order still matters if one ever does again.
 *
 * A token resolving to nothing throws rather than being skipped. A checklist
 * quietly one component short is a wrong answer nobody would ever catch.
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

function resolveRow(row, byId, where) {
  const ids = row.tokens.flatMap((token) => resolveToken(token, byId, where));
  for (const id of ids) {
    if (!byId.has(id)) {
      throw new Error(`plan: PLAN.md ${where} names "${id}", which has no registry entry`);
    }
  }
  return { ...row, ids };
}

/** Every wave with the registry ids it covers, in the plan's order. */
export function waveMembers(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return parseWaves(plan).map((wave) => resolveRow(wave, byId, `wave ${wave.number}`));
}

/** Every §9 milestone with the registry ids it covers, in the plan's order. */
export function milestoneMembers(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return parseMilestones(plan).map((milestone) =>
    resolveRow(milestone, byId, `milestone "${milestone.name}"`)
  );
}

/**
 * `id → wave number`, for everything the waves sequence. An entry outside them
 * is absent rather than zero: unsequenced work is not position zero in the
 * order, and a cell reading 0 would say it was.
 */
export function waveById(plan, entries) {
  const map = new Map();
  for (const wave of waveMembers(plan, entries)) {
    for (const id of wave.ids) map.set(id, wave.number);
  }
  return map;
}

/**
 * `id → milestone`, for every entry the plan places.
 *
 * Anything a wave names is in `CORE_MILESTONE`, because §4 *is* that
 * milestone's checklist. This is the one place the two tables meet, and it is
 * here rather than in each view so that two views cannot disagree about it.
 */
export function milestoneById(plan, entries) {
  const map = new Map();
  for (const milestone of milestoneMembers(plan, entries)) {
    for (const id of milestone.ids) map.set(id, milestone.name);
  }
  for (const id of waveById(plan, entries).keys()) map.set(id, CORE_MILESTONE);
  return map;
}

/** Every milestone, in the plan's order, the core one first. */
export function milestoneNames(plan) {
  return [CORE_MILESTONE, ...parseMilestones(plan).map((milestone) => milestone.name)];
}

/**
 * Every id either table places. What is missing from it is an entry the plan
 * does not mention at all — the thing worth being told about, since a queue
 * that quietly covers part of the set is the failure both tables exist to
 * prevent (ARCHITECTURE.md §8).
 */
export function plannedIds(plan, entries) {
  return new Set(milestoneById(plan, entries).keys());
}

function tally(rows) {
  const done = rows.filter((entry) => readiness(entry) === "ready").length;
  const started = rows.filter((entry) => readiness(entry) === "in progress").length;
  return {
    total: rows.length,
    done,
    started,
    percent: rows.length === 0 ? 0 : Math.round((done / rows.length) * 100),
  };
}

/** Each wave counted against its own size — the shape of the work and the progress through it. */
export function waveProgress(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return waveMembers(plan, entries).map((wave) => ({
    number: wave.number,
    name: wave.name,
    endsWith: wave.endsWith,
    ...tally(wave.ids.map((id) => byId.get(id))),
  }));
}

/**
 * Each milestone counted against its own checklist, the core one first.
 *
 * `0.1`'s members come from §4, which is why it needs no row in §9 and why its
 * `opens` is empty: the decision it opens is the plan's own definition of done,
 * stated in §1, and restating it here would be a second copy of it.
 */
export function milestoneProgress(plan, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const core = [...waveById(plan, entries).keys()].map((id) => byId.get(id));

  return [
    { name: CORE_MILESTONE, opens: "", ...tally(core) },
    ...milestoneMembers(plan, entries).map((milestone) => ({
      name: milestone.name,
      opens: milestone.opens,
      ...tally(milestone.ids.map((id) => byId.get(id))),
    })),
  ];
}

/**
 * Where the work is, in the terms the plan uses: the first milestone that is
 * not complete and the first wave that is not complete. Either is null when
 * everything it ranges over is done — which is an answer, not a gap.
 */
export function whereWeAre(plan, entries) {
  const milestones = milestoneProgress(plan, entries);
  const waves = waveProgress(plan, entries);

  return {
    milestone: milestones.find((row) => row.total > 0 && row.done < row.total) ?? null,
    wave: waves.find((row) => row.done < row.total) ?? null,
    waves: waves.length,
  };
}
