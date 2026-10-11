import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "./yaml.mjs";

export function loadSurfaceMotionProfile(root) {
  const file = path.join(root, "tokens/_surface-motion.yaml");
  if (!existsSync(file)) return null;
  const document = parse(readFileSync(file, "utf8"), { filename: "tokens/_surface-motion.yaml" });
  return {
    source: Object.fromEntries(document.get("source") ?? []),
    layers: [...document.get("layers") ?? []].map(([level, data]) => ({
      level: Number(level), shift: data.get("shift"), scale: data.get("scale"),
    })),
  };
}

export function validateSurfaceMotionProfile(profile, collections) {
  if (!profile) return [];
  const errors = [];
  const at = "tokens/_surface-motion.yaml";
  if (profile.source?.rule !== "FND-MOTION-19" || !profile.source?.decided) {
    errors.push(`${at}: the authored profiles need their rule and decision date.`);
  }
  if (!Array.isArray(profile.layers) || profile.layers.map(entry => entry?.level).join(",") !== "0,1,2,3,4,5,6") {
    errors.push(`${at}: every level from 0 through 6 needs one explicit profile, in order.`);
  }
  const byName = new Map(collections.map(collection => [collection.name, collection]));
  for (const entry of Array.isArray(profile.layers) ? profile.layers : []) {
    const where = `${at}: level ${entry?.level}`;
    const [collection, ...parts] = String(entry?.shift).split("/");
    const token = byName.get(collection)?.tokens.get(parts.join("/"));
    if (collection !== "dimension" || !parts.join("/").startsWith("gap/") || token?.type !== "number") {
      errors.push(`${where}: shift must reference an existing dimension gap token.`);
    }
    if (!Number.isFinite(entry?.scale) || entry.scale <= 0 || entry.scale > 1) {
      errors.push(`${where}: scale must be greater than zero and at most one.`);
    }
    if (entry?.level <= 1 && (entry.shift !== "dimension/gap/g-0_000" || entry.scale !== 1)) {
      errors.push(`${where}: unraised and in-layout profiles introduce no spatial motion.`);
    }
  }
  return errors;
}
