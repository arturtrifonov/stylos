#!/usr/bin/env node
// Writes one Storybook story file per built component into
// apps/workshop/stories/generated/, with a case per documented variant value,
// from the registry entry's `api` (SPEC 0009 §4). Svelte CSF, Storybook 10.
//
//   npm run ui:generate    (with tokens:css and the props types)
//
// The "build the core set" gate of PLAN.md §1 is met when every generated
// story renders — which is why the stories are generated rather than
// authored: an undocumented variant cannot quietly go untested, and a story
// for a value the contract dropped disappears on the next build.
//
// Output is gitignored and rebuilt, like every generated thing.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry, slugPath } from "./lib/registry.mjs";
import { builtComponents, camelName, pascalName } from "./build-ui-types.mjs";

export const STORIES_DIR = "apps/workshop/stories/generated";

/**
 * The args a story starts from: every text, boolean and variant property at
 * its contract default. Instances and slots have no default and are left to
 * the story consumer — a generated story shows the component's own surface.
 */
export function defaultArgs(entry) {
  const args = {};
  for (const property of entry.api) {
    if (property.kind === "instance" || property.kind === "slot") continue;
    // No default but documented values: start from the first of them, so a
    // contract that declines to name a default still has a story that renders.
    const value = property.default ?? (property.values ?? [])[0]?.value;
    if (value === undefined || value === null) continue;
    args[camelName(property.name)] = value;
  }
  return args;
}

function literal(args) {
  const fields = Object.entries(args).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `{{ ${fields.join(", ")} }}`;
}

/**
 * The component's docs-page description, as markdown assembled from the
 * entry's prose — the contract is the documentation, so the page restates
 * nothing: summary, purpose, when to use and not to, limitations, and where
 * the contract lives. Rendered on the autodocs page Storybook generates.
 */
export function componentDescription(entry) {
  const useWhen = entry.useWhen ?? [];
  const doNotUseWhen = entry.doNotUseWhen ?? [];
  const limitations = entry.limitations ?? [];

  const parts = [];
  if (entry.summary) parts.push(`**${entry.summary}**`);
  if (entry.purpose) parts.push(entry.purpose);
  if (useWhen.length > 0) {
    parts.push(["**Use when:**", ...useWhen.map((line) => `- ${line}`)].join("\n"));
  }
  if (doNotUseWhen.length > 0) {
    const lines = doNotUseWhen.map((item) => {
      const instead = [item.instead ?? []].flat().filter(Boolean);
      return `- ${item.text}${instead.length ? ` *Instead: ${instead.join(", ")}.*` : ""}`;
    });
    parts.push(["**Do not use when:**", ...lines].join("\n"));
  }
  if (limitations.length > 0) {
    parts.push(["**Limitations:**", ...limitations.map((line) => `- ${line}`)].join("\n"));
  }
  parts.push(`Contract: \`docs/components/registry/${slugPath(entry.id)}.yaml\``);
  return parts.join("\n\n");
}

/**
 * A variant-value story's description: whatever the contract says about that
 * value — its note, its rationale, and an a11y finding where one is recorded
 * on the value itself. Empty for a value the contract lists without comment.
 */
export function storyDescription(value) {
  const parts = [];
  if (value.note) parts.push(value.note);
  if (value.rationale) parts.push(value.rationale);
  if (value.a11y?.note) {
    const criterion = value.a11y.criterion ? ` (${value.a11y.criterion})` : "";
    parts.push(`**A11y ${value.a11y.status ?? "note"}${criterion}:** ${value.a11y.note}`);
  }
  return parts.join("\n\n");
}

function storyTag(property, value, args) {
  const description = storyDescription(value);
  const parameters = description
    ? ` parameters={{ docs: { description: { story: ${JSON.stringify(description)} } } }}`
    : "";
  return `<Story name="${property.name}: ${value.value}" args=${literal(args)}${parameters} />`;
}

/** The whole .stories.svelte for one entry. */
export function renderStories(entry) {
  const component = pascalName(entry.id);
  const defaults = defaultArgs(entry);

  const stories = [`<Story name="default" args=${literal(defaults)} />`];
  for (const property of entry.api) {
    // A variant's values are its vocabulary; a text property's are examples
    // (docs/components/registry/README.md). Both are worth a story — one
    // covers the surface, the other shows what a value looks like.
    if (property.kind !== "variant" && property.kind !== "text") continue;
    for (const value of property.values ?? []) {
      const args = { ...defaults, [camelName(property.name)]: value.value };
      stories.push(storyTag(property, value, args));
    }
  }

  // The marker lives inside the script block: Storybook's svelte-docgen
  // fails to parse a .stories.svelte that opens with an HTML comment.
  return `<script module>
  // GENERATED by tools/build-ui-stories.mjs from the registry entry "${entry.id}" — do not edit.
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { ${component} } from "@stylos/ui";

  const { Story } = defineMeta({
    title: "Components/${entry.name}",
    component: ${component},
    tags: ["autodocs"],
    parameters: {
      docs: { description: { component: ${JSON.stringify(componentDescription(entry))} } },
    },
  });
</script>

${stories.join("\n")}
`;
}

export function buildStories(root) {
  const entries = loadRegistry(root);
  const built = builtComponents(root, entries);
  const dir = path.join(root, STORIES_DIR);
  // Regenerated wholesale so a story for a component that no longer exists
  // does not survive from an earlier build.
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const written = [];
  for (const entry of built) {
    const file = path.join(dir, `${pascalName(entry.id)}.stories.svelte`);
    writeFileSync(file, renderStories(entry));
    written.push(path.relative(root, file));
  }
  return written;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  const written = buildStories(root);
  console.log(`OK: ${written.length} story file(s) generated — ${written.join(", ")}`);
}
