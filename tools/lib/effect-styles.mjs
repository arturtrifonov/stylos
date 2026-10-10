// Figma effect styles are absent from variable exports. Their explicit record
// stays separate, so importing a collection cannot erase a composed style.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "./yaml.mjs";

export function loadEffectStyles(root) {
  const file = path.join(root, "tokens/_styles.yaml");
  if (!existsSync(file)) return new Map();
  const document = parse(readFileSync(file, "utf8"), { filename: "tokens/_styles.yaml" });
  const source = Object.fromEntries(document.get("source") ?? []);
  return new Map([...document.get("styles") ?? []].map(([name, entry]) => [name, {
    type: entry.get("type"),
    id: entry.get("id"),
    source,
    layers: [...entry.get("layers") ?? []].map(([layer, data]) => ({
      name: layer,
      x: data.get("x"),
      y: data.get("y"),
      blur: data.get("blur"),
      spread: data.get("spread"),
      color: Object.fromEntries(data.get("color") ?? []),
    })),
  }]));
}

export function validateEffectStyles(styles, collections) {
  const errors = [];
  const byName = new Map(collections.map(c => [c.name, c]));
  for (const [name, style] of styles) {
    const at = `tokens/_styles.yaml: ${name}`;
    if (style.type !== "shadow" || !style.id || !style.source.figma_key) {
      errors.push(`${at}: a shadow style needs its Figma style id and source file.`);
    }
    if (!style.layers.length) errors.push(`${at}: a shadow style needs layers.`);
    for (const layer of style.layers) {
      const where = `${at}/${layer.name}`;
      if (![layer.x, layer.y, layer.blur, layer.spread].every(Number.isFinite) || layer.blur < 0) {
        errors.push(`${where}: x/y/blur/spread must be finite numbers, with non-negative blur.`);
      }
      const color = layer.color;
      if (color.ref) {
        const slash = color.ref.indexOf("/");
        const token = byName.get(color.ref.slice(0, slash))?.tokens.get(color.ref.slice(slash + 1));
        if (!token || token.type !== "color" || color.ref.startsWith("palette/")) {
          errors.push(`${where}: ${color.ref} must reference an existing theme-aware colour role.`);
        }
        if (color.values || color.alpha !== undefined) {
          errors.push(`${where}: a colour reference cannot also store a copied value or opacity.`);
        }
      } else if (!color.id || !color.variable ||
        !["light", "dark"].every(mode => /^#[0-9a-f]{6}$/i.test(color.values?.get(mode) ?? "")) ||
        !Number.isFinite(color.alpha) || color.alpha < 0 || color.alpha > 1) {
        errors.push(`${where}: a recorded colour needs its source variable, both themes and alpha in [0, 1].`);
      }
    }
  }
  return errors;
}
