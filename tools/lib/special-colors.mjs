// The categorical colour family, generated from the palette (FND-COLOR-14).
//
// tokens/_special.yaml is an authored scale: one template per role, each naming
// the palette step it takes per mode with `{hue}` standing for the hue group.
// Every palette hue group the scale does not exclude gets every role. Nothing
// here is imported from Figma — the family's membership is a fact about the
// palette, and its steps are a system decision recorded once.
//
// The generated roles join the `color` collection when the canonical set is
// loaded, so every reader — the CSS build, the theme, the report, the registry
// — sees one set of roles and never needs to know which were generated.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "./yaml.mjs";

export const SCALE_FILE = "tokens/_special.yaml";
export const RULE = "FND-COLOR-14";
export const HUE = "{hue}";

/** A role a person or the importer wrote with a `special` segment. */
export function isSpecialRole(tokenPath) {
  return tokenPath.split("/").includes("special");
}

/**
 * The hue a special role's name commits it to, or null where it commits to
 * none. A disabled role drops its hue like every disabled role (FND-COLOR-08).
 */
export function claimedHue(tokenPath) {
  const segments = tokenPath.split("/");
  const at = segments.indexOf("special");
  if (at === -1 || segments.at(-1) === "disabled") return null;
  return segments[at + 1] ?? null;
}

export function loadSpecialScale(root) {
  const file = path.join(root, SCALE_FILE);
  if (!existsSync(file)) return null;
  const document = parse(readFileSync(file, "utf8"), { filename: SCALE_FILE });
  return {
    source: Object.fromEntries(document.get("source") ?? []),
    exclude: document.get("exclude") ?? [],
    roles: [...(document.get("roles") ?? new Map())].map(([template, ref]) => ({
      template,
      ref: ref instanceof Map ? ref : new Map(),
    })),
  };
}

/** Hue groups in palette order, without the excluded ones. */
export function specialHues(palette, scale) {
  const excluded = new Set(scale?.exclude ?? []);
  const hues = [];
  for (const tokenPath of palette.tokens.keys()) {
    const hue = tokenPath.split("/")[0];
    if (!excluded.has(hue) && !hues.includes(hue)) hues.push(hue);
  }
  return hues;
}

/**
 * The generated roles, in reading order: within each name prefix, every hue
 * with its roles in template order — `surface/bold/special/slate/default`,
 * `…/slate/hover`, …, then `surface/bold/special/gray/default`.
 *
 * @returns {Map<string, import("./tokens.mjs").Token>}
 */
export function generateSpecialRoles(scale, palette) {
  const generated = new Map();
  if (!scale || !palette) return generated;

  const groups = new Map();
  for (const role of scale.roles) {
    const prefix = role.template.slice(0, role.template.indexOf(HUE));
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(role);
  }

  for (const roles of groups.values()) {
    for (const hue of specialHues(palette, scale)) {
      for (const { template, ref } of roles) {
        generated.set(template.replaceAll(HUE, hue), {
          type: "color",
          id: null,
          scopes: [],
          values: new Map(),
          alpha: new Map(),
          ref: new Map([...ref].map(([mode, target]) => [mode, String(target).replaceAll(HUE, hue)])),
          generated: SCALE_FILE,
        });
      }
    }
  }
  return generated;
}

/**
 * The colour collection with the generated family in place: each area's
 * generated roles follow that area's recorded roles. A recorded role of the
 * same name is replaced — it should not exist, and `validateSpecialScale`
 * says so — so the loaded set never holds two answers for one name.
 */
export function withSpecialRoles(color, palette, scale) {
  const generated = generateSpecialRoles(scale, palette);
  if (generated.size === 0) return color;

  const area = (tokenPath) => tokenPath.split("/")[0];
  const pending = new Map();
  for (const [tokenPath, token] of generated) {
    if (!pending.has(area(tokenPath))) pending.set(area(tokenPath), new Map());
    pending.get(area(tokenPath)).set(tokenPath, token);
  }

  const tokens = new Map();
  const flush = (name) => {
    for (const [tokenPath, token] of pending.get(name) ?? []) tokens.set(tokenPath, token);
    pending.delete(name);
  };

  let current = null;
  for (const [tokenPath, token] of color.tokens) {
    if (generated.has(tokenPath)) continue;
    if (current !== null && area(tokenPath) !== current) flush(current);
    current = area(tokenPath);
    tokens.set(tokenPath, token);
  }
  if (current !== null) flush(current);
  for (const name of [...pending.keys()]) flush(name);

  return { ...color, tokens };
}

/**
 * The scale is well formed, every generated binding lands on a palette step
 * that exists, and the record holds no special role of its own.
 *
 * @param {object|null} scale
 * @param {{color: object, palette: object, paletteName: string, recorded?: Iterable<string>}} input
 */
export function validateSpecialScale(scale, { color, palette, paletteName, recorded = [] }) {
  const errors = [];
  const at = SCALE_FILE;

  for (const tokenPath of recorded) {
    if (isSpecialRole(tokenPath)) {
      errors.push(
        `tokens/color.yaml records color/${tokenPath}. Special roles are generated from ` +
          `${SCALE_FILE} and never recorded — re-import the collection, which drops them (${RULE}).`
      );
    }
  }

  if (!scale) {
    errors.push(`${at} is missing. The special family is generated from it (${RULE}).`);
    return errors;
  }
  if (scale.source?.rule !== RULE || !scale.source?.decided) {
    errors.push(`${at}: the authored scale needs its rule (${RULE}) and decision date.`);
  }

  const groups = new Set([...palette.tokens.keys()].map((tokenPath) => tokenPath.split("/")[0]));
  for (const hue of scale.exclude) {
    if (!groups.has(hue)) errors.push(`${at}: excludes "${hue}", which is not a ${paletteName} hue group.`);
  }
  if (scale.roles.length === 0) errors.push(`${at}: names no roles.`);

  const hues = specialHues(palette, scale);
  const modes = color.modes;
  const seen = new Set();

  for (const { template, ref } of scale.roles) {
    const where = `${at}: "${template}"`;
    const segments = template.split("/");
    const special = segments.indexOf("special");
    if (
      template.split(HUE).length !== 2 ||
      special < 1 ||
      segments[special + 1] !== HUE ||
      segments.slice(special + 2).some((s) => s.includes("{"))
    ) {
      errors.push(`${where} must name its area, then special/${HUE}, with ${HUE} written once.`);
      continue;
    }
    if (seen.has(template)) errors.push(`${where} is listed twice.`);
    seen.add(template);

    const keys = [...ref.keys()];
    const unknown = keys.filter((k) => k !== "default" && !modes.includes(k));
    if (keys.length === 0 || unknown.length || (keys.includes("default") && keys.length > 1) ||
        (!keys.includes("default") && modes.some((mode) => !ref.has(mode)))) {
      errors.push(`${where} needs a reference for "default", or one for each of ${modes.join(", ")}.`);
      continue;
    }

    const disabled = segments.at(-1) === "disabled";
    for (const [mode, target] of ref) {
      const text = String(target);
      if (!text.startsWith(`${paletteName}/`)) {
        errors.push(`${where} (${mode}) references "${text}", outside "${paletteName}".`);
        continue;
      }
      if (!disabled && !text.startsWith(`${paletteName}/${HUE}/`)) {
        errors.push(
          `${where} (${mode}) references "${text}". A special role takes a step of its own hue; ` +
            `only a disabled role drops it (FND-COLOR-08).`
        );
        continue;
      }
      for (const hue of hues) {
        const step = text.replaceAll(HUE, hue).slice(paletteName.length + 1);
        if (!palette.tokens.has(step)) {
          errors.push(`${where} (${mode}) generates "${paletteName}/${step}", which the palette does not have.`);
        }
      }
    }
  }
  return errors;
}
