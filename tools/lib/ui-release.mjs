import { defaultArgs } from "../build-ui-stories.mjs";
import { camelName } from "../build-ui-types.mjs";

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
  const optional = entry.api.filter(property => property.kind === "boolean")
    .flatMap(property => [false, true].map(value => ({ ...defaults, [camelName(property.name)]: value })));
  const seen = new Set();
  return [defaults, ...combinations, ...optional].filter(args => {
    const key = JSON.stringify(Object.entries(args).sort(([a], [b]) => a.localeCompare(b)));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
