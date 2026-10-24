import { defaultArgs } from "../build-ui-stories.mjs";
import { camelName } from "../build-ui-types.mjs";
import { parseFragment } from "parse5";

// These gates are behavioural and do not use registry controls groups.
const visibilityGates = {
  Modal: ["is open"], Drawer: ["is open"], "Table Cell Heading": ["is sorted"],
  Accordion: ["is expanded"], "Alert Inline": ["is open"], "Alert Popup": ["is open"], "Alert Popup Timer": ["is open"],
};

// Exhaust the registry's variant product; exercise each optional boolean
// independently as well, without pretending to exhaust content or slot values.
export function releaseCases(entry) {
  let combinations = [defaultArgs(entry)];
  for (const property of entry.api.filter(property => property.kind === "variant")) {
    if (!property.values?.length) throw new Error(`${entry.id}: empty variant ${property.name}`);
    combinations = combinations.flatMap(args => property.values.map(({ value }) => ({
      ...args, [camelName(property.name)]: value,
    })));
  }
  const defaults = defaultArgs(entry);
  const variantNames = new Set(entry.api.filter(property => property.kind === "variant").map(property => property.name));
  const gates = entry.api.filter(property => property.kind === "boolean" &&
    (property.controls?.some(name => variantNames.has(name)) || visibilityGates[entry.id]?.includes(property.name)));
  const exposed = combinations.map(args => ({ ...args,
    ...Object.fromEntries(gates.map(property => [camelName(property.name), true])),
  }));
  const optional = entry.api.filter(property => property.kind === "boolean")
    .flatMap(property => [false, true].map(value => ({ ...defaults, [camelName(property.name)]: value })));
  const seen = new Set();
  return [defaults, ...combinations, ...exposed, ...optional].filter(args => {
    const key = JSON.stringify(Object.entries(args).sort(([a], [b]) => a.localeCompare(b)));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function markupReader(html) {
  const nodes = [];
  function walk(node) { if (node.tagName) nodes.push(node); for (const child of node.childNodes ?? []) walk(child); }
  walk(parseFragment(html));
  return (className, attribute) => {
    const node = nodes.find(node => node.attrs.some(attr => attr.name === "class" && attr.value.split(/\s+/).includes(className)));
    if (!node) return undefined;
    return attribute === undefined ? node : node.attrs.find(attr => attr.name === attribute)?.value ?? null;
  };
}

// Verify that fixtures actually forward variant arguments, including properties
// whose representation is native semantics rather than a root data attribute.
export function variantChecks(entry) {
  const root = `stylos-${entry.id.toLowerCase().replaceAll(" ", "-")}`;
  return entry.api.filter(property => property.kind === "variant" && property.name !== "placement").map(property => {
    if (entry.id === "Accordion" && property.name === "heading level") {
      return { prop: "headingLevel", className: "stylos-accordion-heading", tagName: true };
    }
    let className = root;
    let attribute = `data-${property.name.replaceAll(" ", "-")}`;
    if (property.name === "type" && ["Button", "Button Icon"].includes(entry.id)) attribute = "type";
    if (property.name === "is checked" && / (Label|Text)$/.test(entry.id)) className = `stylos-${entry.family.toLowerCase()}-input`;
    if (entry.id === "Dropdown" && property.name === "content role") { className = "stylos-dropdown-options"; attribute = "role"; }
    if (entry.id === "Dropdown Item Default" && property.name === "interaction") attribute = "role";
    if (property.name === "sort direction") attribute = "aria-sort";
    return { prop: camelName(property.name), className, attribute };
  });
}
