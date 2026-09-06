#!/usr/bin/env node
// Validates docs/components/registry/**/*.yaml.
//
//   npm run validate:registry
//
// Two kinds of finding, and the difference is the point:
//
//   FAIL   the registry contradicts itself — a dangling reference, a duplicate
//          id, a file in the wrong place, a Figma link that cannot resolve.
//          Exit 1.
//   REPORT something a human has to judge — a relation recorded on one side
//          only, a child at or above its parent's level, an entry with no
//          relations at all. Exit 0.
//
// The reports are expected to be noisy on the current data. It came from a CSV
// export of Airtable's relational fields, which the registry README already
// records as lossy; the mismatches are what that cost looks like. Which side of
// a non-reciprocal relation is wrong is a judgement, so nothing here repairs
// anything — see docs/specs/0002-registry-viewer.md §5.
//
// Reading is delegated to lib/registry.mjs, which parses the files with the
// real reader in lib/yaml.mjs rather than the regexes this script used to
// carry. The regexes could not have seen inside a `figma:` block.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRegistry,
  derive,
  readiness,
  registryPathFor,
  insteadIds,
  levelRank,
  LEVELS,
  STATUSES,
  PROPERTY_KINDS,
  A11Y_STATUSES,
  SIZING_AXES,
  LINE_HEIGHT_FAMILIES,
  MOTION_FIELDS,
  COMPONENT_FILE_KEYS,
} from "./lib/registry.mjs";
import { SIZING_TOKEN_FIELDS, createTokenResolver } from "./lib/sizing.mjs";
import { readPlan, plannedIds } from "./lib/plan.mjs";

// Most entries carry none of the contract fields — they are the Airtable
// inventory and nothing more. Absence is never a failure: every check below
// runs only when the field it is about is present, so a legacy entry passes
// without being pretended to be a contract. How many is derived, not counted
// here: it is `documented` in the registry view.
const CONTRACT_STALE_DAYS = 90;

function properties(entry) {
  return Array.isArray(entry.api) ? entry.api : [];
}

function valuesOf(property) {
  return Array.isArray(property?.values) ? property.values : [];
}

function daysSince(date, today) {
  const then = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((today.getTime() - then) / 86400000);
}

export function checkRegistry(
  entries,
  { today = new Date(), resolveToken = null, planned = null, systemVersion = null } = {}
) {
  const errors = [];
  const reports = [];

  const byId = new Map();
  for (const entry of entries) {
    if (!entry.id) {
      errors.push(`${entry.file}: missing "id"`);
      continue;
    }
    // Two files claiming one id: every reference to it resolves to whichever
    // was read last, and the loser is unreachable without being missing.
    if (byId.has(entry.id)) {
      errors.push(
        `${entry.file}: duplicate id "${entry.id}", already declared by ${byId.get(entry.id).file}`
      );
      continue;
    }
    byId.set(entry.id, entry);
  }

  for (const entry of entries) {
    if (!entry.id) continue;

    if (!LEVELS.includes(entry.level)) {
      errors.push(`${entry.file}: level "${entry.level}" is not one of ${LEVELS.join(", ")}`);
    }

    // The path is derived from the id, so a file in the wrong place means one
    // of the two was edited without the other.
    const expected = registryPathFor(entry.id);
    if (entry.file !== expected) {
      errors.push(`${entry.file}: id "${entry.id}" belongs at ${expected}`);
    }

    for (const ref of [...entry.children, ...entry.parents]) {
      if (!byId.has(ref)) {
        errors.push(`${entry.file}: references "${ref}", which has no matching component id`);
      }
    }

    const figma = entry.figma;
    if (figma) {
      if (figma.node_id && !figma.file_key) {
        errors.push(
          `${entry.file}: figma.node_id without figma.file_key — a node id is only addressable ` +
            `inside a file, and components live in two of them`
        );
      }
      if (figma.file_key && !COMPONENT_FILE_KEYS.has(figma.file_key)) {
        errors.push(
          `${entry.file}: figma.file_key "${figma.file_key}" is not a component file. ` +
            `Expected one of ${[...COMPONENT_FILE_KEYS]
              .map(([key, name]) => `${key} (${name})`)
              .join(", ")} — see figma/README.md`
        );
      }
    }
  }

  // Non-reciprocal relations, both directions. A lists B as a child while B
  // does not list A as a parent, and the reverse.
  for (const entry of entries) {
    if (!entry.id) continue;
    for (const child of entry.children) {
      const other = byId.get(child);
      if (other && !other.parents.includes(entry.id)) {
        reports.push(
          `"${entry.id}" lists "${child}" as a child, but "${child}" does not list it as a parent`
        );
      }
    }
    for (const parent of entry.parents) {
      const other = byId.get(parent);
      if (other && !other.children.includes(entry.id)) {
        reports.push(
          `"${entry.id}" lists "${parent}" as a parent, but "${parent}" does not list it as a child`
        );
      }
    }
  }

  // A child at or above its parent's level. Information, not a fault: this
  // repository names exceptions rather than forbidding them (docs/charter.md).
  for (const entry of entries) {
    if (!entry.id) continue;
    const rank = levelRank(entry.level);
    if (rank === -1) continue;
    for (const child of entry.children) {
      const other = byId.get(child);
      if (!other) continue;
      const childRank = levelRank(other.level);
      if (childRank === -1) continue;
      if (childRank >= rank) {
        reports.push(
          `"${entry.id}" (${entry.level}) is composed from "${child}" (${other.level}), ` +
            `which is at or above its own level`
        );
      }
    }
  }

  // Named by neither table in PLAN.md — no milestone, and so no place on the
  // road at all. Every entry carries exactly one milestone (ARCHITECTURE.md §8),
  // and a checklist that quietly covers part of the set is the thing both
  // tables exist to prevent. A run with no plan to check against skips it.
  if (planned) {
    for (const entry of entries) {
      if (!entry.id) continue;
      if (!planned.has(entry.id)) {
        reports.push(`"${entry.id}" is named by neither table in PLAN.md — §4 waves nor §9 milestones`);
      }
    }
  }

  // Neither composed from anything nor used inside anything. Usually a gap in
  // the import rather than a real island.
  for (const entry of entries) {
    if (!entry.id) continue;
    if (entry.children.length === 0 && entry.parents.length === 0) {
      reports.push(`"${entry.id}" has no parents and no children`);
    }
  }

  for (const entry of entries) {
    if (!entry.id) continue;
    checkContract(entry, byId, errors, resolveToken, systemVersion);
    reportContract(entry, entries, reports, today);
  }

  return { ok: errors.length === 0, errors, reports };
}

// --- `version` (docs/specs/0006-versioning-and-release-0-1-0.md §7) --------
//
// The release in which this contract's current API shipped. Two things make it
// checkable and this checks both: it is a full release string, so it reads
// against a git tag without interpretation and sorts; and it names a release
// that exists. A version ahead of `package.json` claims the API shipped in
// something that has not been cut, which is the one way this field can lie
// without anyone noticing — a forgotten bump reads as `draft` somewhere else,
// an invented one reads as nothing at all.

const RELEASE = /^(\d+)\.(\d+)\.(\d+)$/;

/** -1, 0 or 1. Both arguments have already matched RELEASE. */
export function compareRelease(a, b) {
  const [, ...left] = RELEASE.exec(a);
  const [, ...right] = RELEASE.exec(b);
  for (let i = 0; i < 3; i += 1) {
    const diff = Number(left[i]) - Number(right[i]);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

function checkVersion(file, version, systemVersion, errors) {
  if (version === null || version === undefined) return;

  if (typeof version !== "string" || !RELEASE.test(version)) {
    errors.push(
      `${file}: version "${version}" is not a release — write the full string, ` +
        `"0.1.0" rather than "0.1", so it reads against a git tag and sorts`
    );
    return;
  }

  // No package.json to read means no opinion, not a pass by default: the
  // callers that supply one are the ones that can have one.
  if (!systemVersion || !RELEASE.test(systemVersion)) return;

  if (compareRelease(version, systemVersion) > 0) {
    errors.push(
      `${file}: version "${version}" is ahead of package.json (${systemVersion}) — ` +
        `a contract cannot have shipped in a release that has not been cut`
    );
  }
}

// --- The contract (docs/specs/0003-component-page.md §3) -------------------
//
// Every check here is conditional on the field it is about being present. A
// legacy entry carries none of them and must pass; a contract that carries a
// field carries it correctly or fails.

function checkContract(entry, byId, errors, resolveToken, systemVersion) {
  const file = entry.file;
  const api = properties(entry);

  if (entry.status !== null && !STATUSES.includes(entry.status)) {
    errors.push(`${file}: status "${entry.status}" is not one of ${STATUSES.join(", ")}`);
  }

  checkVersion(file, entry.version, systemVersion, errors);

  // The two columns of the index, and the one direction they are allowed to
  // disagree in. `status: ready` asserts both gates of STANDARD.md hold, and
  // the first of them — *Complete enough to publish* — is exactly what the
  // derived contract state computes: the prose written and `figma.node_id`
  // present. So a `ready` component whose contract is not complete is the
  // registry contradicting itself, not a judgement call.
  //
  // The converse is not a finding. A complete contract on a `draft` component
  // is the ordinary state of a written-up entry nobody has checked in Figma
  // yet, which is most of the core set between a wave closing and the release
  // pass reaching it.
  if (entry.status === "ready") {
    const contract = readiness(entry);
    if (contract !== "complete") {
      errors.push(
        `${file}: status is "ready" but the contract is "${contract}" — ` +
          `"ready" claims both gates of STANDARD.md, and the first of them is ` +
          `this contract being complete. ${
            derive(entry).documented
              ? "figma.node_id is missing"
              : "the prose is incomplete: summary, purpose, a use_when, and a description on every property"
          }.`
      );
    }
  }

  for (const finding of entry.a11y) {
    checkFinding(file, "a11y", finding, errors);
  }

  // `instead` is an anchor, not a phrase: a renamed alternative has to break
  // loudly rather than leave a sentence pointing at nothing. A null is the
  // recorded judgement that no other component is right. A list is a family
  // answering together, and every member of it is an anchor.
  for (const avoid of entry.doNotUseWhen) {
    for (const instead of insteadIds(avoid)) {
      if (!byId.has(instead)) {
        errors.push(
          `${file}: do_not_use_when names "${instead}" as the alternative, ` +
            `which has no matching component id`
        );
      }
    }
  }

  const names = new Set(api.map((property) => property?.name).filter(Boolean));

  api.forEach((property, index) => {
    const where = `api "${property?.name ?? index}"`;

    if (property?.kind !== undefined && !PROPERTY_KINDS.includes(property.kind)) {
      errors.push(
        `${file}: ${where} has kind "${property.kind}", not one of ${PROPERTY_KINDS.join(", ")}`
      );
    }

    if (property?.a11y) checkFinding(file, where, property.a11y, errors);

    const values = valuesOf(property);

    if (property?.kind === "variant" && property.default !== undefined && values.length > 0) {
      const allowed = values.map((value) => value?.value);
      if (!allowed.includes(property.default)) {
        errors.push(
          `${file}: ${where} defaults to "${property.default}", which is not one of its values ` +
            `(${allowed.join(", ")})`
        );
      }
    }

    for (const value of values) {
      if (value?.a11y) {
        checkFinding(file, `${where} value "${value.value}"`, value.a11y, errors);
        // A component that ships something failing a criterion has to say why.
        // Silence there reads as an oversight rather than a decision.
        if (!value.rationale) {
          errors.push(
            `${file}: ${where} value "${value.value}" carries an a11y finding and no rationale`
          );
        }
      }
    }

    const controls = Array.isArray(property?.controls) ? property.controls : [];
    if (controls.length > 0) {
      if (property.kind !== "boolean") {
        errors.push(
          `${file}: ${where} has controls but kind "${property.kind}" — only a boolean governs ` +
            `an element's presence (naming.md §9)`
        );
      }
      for (const controlled of controls) {
        if (!names.has(controlled)) {
          errors.push(
            `${file}: ${where} controls "${controlled}", which is not a property of this component`
          );
          continue;
        }
        // naming.md §9: recording the group is what makes the adjacency
        // checkable rather than conventional — the controlled properties
        // occupy the slots straight after the boolean, and nothing unrelated
        // splits them.
        const at = api.findIndex((other) => other?.name === controlled);
        if (at <= index || at > index + controls.length) {
          errors.push(
            `${file}: ${where} controls "${controlled}", which does not immediately follow it in ` +
              `api order (naming.md §9)`
          );
        }
      }
    }
  });

  // `motion` is present only where the animation is part of what the component
  // is, and its key set is closed — see MOTION_FIELDS. `drives` names the
  // property the animation steps through, so it is an anchor into `api` the
  // same way `controls` is, and a renamed property has to break here.
  const motion = entry.motion;
  if (motion) {
    for (const key of Object.keys(motion)) {
      if (!MOTION_FIELDS.includes(key)) {
        errors.push(
          `${file}: motion.${key} is not one of ${MOTION_FIELDS.join(", ")} — durations, easing ` +
            `curves and per-step timings are how one implementation runs the idea, and recording ` +
            `them here makes a specification out of whatever the prototype happens to do`
        );
      }
    }
    if (motion.loop !== undefined && typeof motion.loop !== "boolean") {
      errors.push(`${file}: motion.loop is ${JSON.stringify(motion.loop)}, not true or false`);
    }
    if (motion.drives !== undefined) {
      if (typeof motion.drives !== "string") {
        errors.push(
          `${file}: motion.drives is ${JSON.stringify(motion.drives)}, not the name of a property`
        );
      } else if (!names.has(motion.drives)) {
        errors.push(
          `${file}: motion.drives is "${motion.drives}", which is not a property of this component`
        );
      }
    }
  }

  // A sequence of strings, each one a fact about how Figma happens to
  // implement this component. A mapping here is someone reaching for a shape
  // the block does not have.
  entry.figmaNotes.forEach((note, index) => {
    if (typeof note !== "string") {
      errors.push(
        `${file}: figma_notes[${index}] is ${JSON.stringify(note)} — the block is a sequence of ` +
          `strings, nothing else`
      );
    }
  });

  const variants = entry.variants;
  if (variants?.complete_cross_product === true && typeof variants.count === "number") {
    const variantProperties = api.filter((property) => property?.kind === "variant");
    const product = variantProperties.reduce(
      (total, property) => total * Math.max(valuesOf(property).length, 1),
      1
    );
    if (variantProperties.length > 0 && product !== variants.count) {
      errors.push(
        `${file}: variants.count is ${variants.count}, but the variant properties ` +
          `(${variantProperties
            .map((property) => `${property.name} of ${valuesOf(property).length}`)
            .join(", ")}) multiply to ${product}`
      );
    }
  }

  const sizing = entry.sizingModel;
  if (sizing) {
    for (const axis of ["horizontal", "vertical"]) {
      const value = sizing[axis];
      if (value !== undefined && !SIZING_AXES.includes(value)) {
        errors.push(
          `${file}: sizing_model.${axis} is "${value}", not one of ${SIZING_AXES.join(", ")}`
        );
      }
    }

    const sizes = Array.isArray(sizing.sizes) ? sizing.sizes : [];
    if (sizes.length > 0) {
      const sizeProperty = api.find((property) => property?.name === "size");
      const declared = valuesOf(sizeProperty).map((value) => value?.value);
      const rows = sizes.map((row) => row?.size);
      if (declared.join(" ") !== rows.join(" ")) {
        errors.push(
          `${file}: sizing_model.sizes is ${rows.join(", ") || "empty"} but the size property is ` +
            `${declared.join(", ") || "not declared"} — they must match exactly, in order`
        );
      }
      for (const row of sizes) {
        for (const [field, collection] of SIZING_TOKEN_FIELDS) {
          const value = row?.[field];
          if (value === undefined) continue;

          // A number here is a transcription of something that lives in
          // tokens/, and it is wrong the first time the scale moves.
          if (typeof value !== "string") {
            errors.push(
              `${file}: sizing_model.sizes "${row.size}" has ${field}: ${JSON.stringify(value)} — ` +
                `every dimension and type measure is a token name, never a number`
            );
            continue;
          }
          // Resolved on every build, so a name that addresses nothing has to
          // break here rather than leave a blank cell on the page.
          if (resolveToken && resolveToken(field, value) === undefined) {
            errors.push(
              `${file}: sizing_model.sizes "${row.size}" has ${field}: "${value}", ` +
                `which does not resolve against tokens/${collection}.yaml`
            );
          }
        }

        const family = row?.line_height_family;
        if (family !== undefined && !LINE_HEIGHT_FAMILIES.includes(family)) {
          errors.push(
            `${file}: sizing_model.sizes "${row.size}" has line_height_family "${family}", ` +
              `not one of ${LINE_HEIGHT_FAMILIES.join(", ")}`
          );
        }
      }
    }
  }
}

function checkFinding(file, where, finding, errors) {
  const status = finding?.status;
  if (status !== undefined && !A11Y_STATUSES.includes(status)) {
    errors.push(
      `${file}: ${where} has a11y.status "${status}", not one of ${A11Y_STATUSES.join(", ")}`
    );
  }
}

// A finding that fails a criterion should say which one — in the `criterion`
// field, or in the note where the note is the whole of it.
function namesCriterion(finding) {
  if (finding?.criterion) return true;
  return /WCAG|SC \d/.test(String(finding?.note ?? ""));
}

function reportContract(entry, entries, reports, today) {
  const api = properties(entry);

  if (api.length > 0) {
    const missing = [];
    if (!entry.summary) missing.push("summary");
    if (!entry.purpose) missing.push("purpose");
    if (entry.useWhen.length === 0) missing.push("use_when");
    if (entry.doNotUseWhen.length === 0) missing.push("do_not_use_when");
    if (missing.length > 0) {
      reports.push(`"${entry.id}" has an api but no ${missing.join(", ")}`);
    }

    if (!entry.sizingModel) {
      reports.push(`"${entry.id}" has an api but no sizing_model`);
    } else if (!entry.sizingModel.intent) {
      // Without it the page says "hug" and the deliberateness is gone.
      reports.push(`"${entry.id}" has a sizing_model with no intent`);
    }
  }

  for (const property of api) {
    if (!property?.description) {
      reports.push(`"${entry.id}" property "${property?.name}" has no description`);
    }
  }

  // `api` describes the web component, not the Figma file (SPEC 0009 §5).
  // A property that only draws a state the real component decides for itself
  // belongs in `figma_notes` as drawing-only — the exception registry/README.md
  // defines for `has scrollbar`. `disabled` and `read only` stay: real states.
  const DRAWING_ONLY_STATES = new Set(["hover", "active", "focus"]);
  for (const property of api) {
    if (property?.name === "is focused") {
      reports.push(
        `"${entry.id}" api carries "is focused" — a drawing-only property; record it in figma_notes`
      );
    }
    if (property?.name === "state") {
      const drawn = valuesOf(property)
        .map((value) => value?.value)
        .filter((value) => DRAWING_ONLY_STATES.has(value));
      if (drawn.length > 0) {
        reports.push(
          `"${entry.id}" api carries state = ${drawn.join("/")} — drawing-only values; ` +
            `record them in figma_notes`
        );
      }
    }
  }

  const findings = [
    ...entry.a11y.map((finding) => [finding, "the component"]),
    ...api.flatMap((property) => [
      ...(property?.a11y ? [[property.a11y, `property "${property.name}"`]] : []),
      ...valuesOf(property)
        .filter((value) => value?.a11y)
        .map((value) => [value.a11y, `${property.name} = "${value.value}"`]),
    ]),
  ];
  for (const [finding, where] of findings) {
    if ((finding.status === "warning" || finding.status === "fail") && !namesCriterion(finding)) {
      reports.push(
        `"${entry.id}" records an a11y ${finding.status} on ${where} without naming a criterion`
      );
    }
  }

  // Every entry is expected to carry `html`, and `"no semantic html"` is a
  // value — saying so records that the question was asked. An absent one means
  // nobody has looked yet, which on a component claiming both gates of
  // STANDARD.md is a gap rather than a silence.
  if (entry.status === "ready" && !entry.html) {
    reports.push(
      `"${entry.id}" is ready and records no html — "no semantic html" is a value, absence is not`
    );
  }

  // Without it the page says the component loops and the reason a stopped
  // instance is wrong is gone — the same thing `sizing_model.intent` carries.
  if (entry.motion && !entry.motion.intent) {
    reports.push(`"${entry.id}" has a motion block with no intent`);
  }

  if (entry.status === "ready" && entry.figma?.last_verified) {
    const age = daysSince(entry.figma.last_verified, today);
    if (age !== null && age > CONTRACT_STALE_DAYS) {
      reports.push(
        `"${entry.id}" is ready and was last verified against Figma ${age} days ago ` +
          `(${entry.figma.last_verified})`
      );
    }
  }

  if (entry.family) {
    const siblings = entries.filter((other) => other !== entry && other.family === entry.family);
    if (siblings.length === 0) {
      reports.push(`"${entry.id}" is the only member of family "${entry.family}"`);
    }
  }
}


const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const entries = loadRegistry(root);
  const plan = readPlan(root);
  const { ok, errors, reports } = checkRegistry(entries, {
    resolveToken: createTokenResolver(root),
    planned: plan ? plannedIds(plan, entries) : null,
    systemVersion: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version,
  });

  for (const report of reports) console.error(`REPORT  ${report}`);
  for (const error of errors) console.error(`FAIL    ${error}`);

  if (reports.length > 0) {
    console.error(
      `\n${reports.length} report(s) — judgement, not failure. Nothing is repaired automatically.`
    );
  }
  if (!ok) {
    console.error(`\nFAIL: ${errors.length} registry issue(s).`);
    process.exit(1);
  }

  console.log(
    `OK: ${entries.length} registry entries, all references resolve` +
      (reports.length > 0 ? `, ${reports.length} report(s) outstanding.` : ".")
  );
}
