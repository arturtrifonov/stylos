#!/usr/bin/env node
// Projects the canonical token set onto CSS custom properties.
//
//   npm run tokens:css                 write packages/ui/dist/{tokens.css,tokens.json}
//   npm run tokens:css -- --out <dir>  write them somewhere else
//   npm run tokens:css -- --stdout     print the CSS and write nothing
//
// Built to docs/specs/0007-tokens-to-css.md, which carries the reasoning.
//
// This is a projection of the record, not a second record. It reads
// tokens/*.yaml and nothing else — no network, no Figma access — and its
// output is not committed. Nothing here improves a value on the way through:
// `radius/round` is 1000px because that is what the token says, and a
// generator that rounds it to 9999px would be a second source of truth.
//
// It refuses to run on a token set that does not pass `npm run tokens:check`.
// That is the whole of its responsibility for a token that disappeared —
// the withdrawal itself is caught at import, where it happens (SPEC 0007 §6).

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCanonical } from "./lib/tokens.mjs";
import { readNaming, runCheck } from "./check-tokens.mjs";

export const PREFIX = "--stylos-";

/** Where the build writes, unless told otherwise. Not committed. */
export const OUT_DIR = "packages/ui/dist";

/**
 * The five slots, and the hue group each is bound to today.
 *
 * Authored here rather than derived, and that is the point: derived from the
 * data it would agree with the data by construction and check nothing. Stated,
 * it makes docs/foundations/color.md's central claim — every role outside
 * every role outside `special` draws on exactly these five groups — a build failure when it
 * stops being true. A slot rebound in Figma to a hue outside its slot is
 * exactly what this catches.
 */
export const SLOT_BINDING = new Map([
  ["base", "slate"],
  ["primary", "indigo"],
  ["success", "green"],
  ["warning", "amber"],
  ["danger", "red"],
]);

/**
 * Fallback stacks. Figma has no field for one and typography.md names the
 * typefaces without them, so they are a decision, made here and listed in
 * SPEC 0007 §3. Only the fallbacks are authored — the typeface itself comes
 * from the token, so a change in Figma still lands. A family token with no
 * entry here fails the build rather than shipping with no stack.
 */
export const FONT_FALLBACKS = new Map([
  ["family/normal", ["system-ui", "sans-serif"]],
  ["family/display", ["system-ui", "sans-serif"]],
  ["family/code", ["ui-monospace", "monospace"]],
]);

/** Emitted as a bare number; everything else numeric takes `px`. */
const UNITLESS = (tokenPath) => tokenPath.startsWith("weight/");

// --- The name rule (SPEC 0007 §2) ------------------------------------------

/**
 * Exactly three substitutions, applied to the whole string: lowercase,
 * `/` -> `-`, ` ` -> `-`. Nothing else is touched, so `_` and digits survive.
 *
 * It is deliberately not reversible — `-` stands for both `/` and a space —
 * which is why the manifest exists.
 */
export function slug(text) {
  return text.toLowerCase().split("/").join("-").split(" ").join("-");
}

/** `property("palette", "light", "indigo/700")` -> `--stylos-palette-light-indigo-700`. */
export function property(...parts) {
  return PREFIX + slug(parts.filter((p) => p !== null && p !== "").join("/"));
}

// --- Values (SPEC 0007 §3) -------------------------------------------------

export function cssColor(hex, alpha = 1) {
  const value = String(hex).toLowerCase();
  if (alpha >= 1) return value;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

export function cssNumber(value, tokenPath) {
  return UNITLESS(tokenPath) ? String(value) : `${value}px`;
}

// --- Slots (SPEC 0007 §4.2) ------------------------------------------------

/**
 * Which slot a role takes, decided from its name and never from its value.
 *
 * The order matters: a literal is not a reference at all, a `special` role keeps
 * its hue by design, `background/base` reaches the palette group `base`
 * rather than the slot of the same name, and `disabled` overrides whatever
 * the rest of the path says because a disabled control is structurally inert.
 * What is left takes the slot its name states, or `base` when it states none —
 * every such role is neutral structure.
 *
 * @returns {{slot: string|null, why: string}}
 */
export function slotOf(tokenPath, { hasRef }) {
  const segments = tokenPath.split("/");
  if (!hasRef) return { slot: null, why: "literal" };
  if (segments.includes("special")) return { slot: null, why: "special" };
  if (tokenPath === "background/base") return { slot: null, why: "palette-base" };
  if (segments.at(-1) === "disabled") return { slot: "base", why: "disabled" };
  for (const name of SLOT_BINDING.keys()) {
    if (segments.includes(name)) return { slot: name, why: "named" };
  }
  return { slot: "base", why: "neutral" };
}

/** The hue group a role's alias must land in, or null where nothing is implied. */
function expectedGroup(tokenPath, { slot, why }) {
  if (slot) return SLOT_BINDING.get(slot);
  if (why === "special") return tokenPath.split("/").at(-1);
  if (why === "palette-base") return "base";
  return null;
}

// --- The build -------------------------------------------------------------

/**
 * @param {object} input
 * @param {import("./lib/tokens.mjs").Collection[]} input.collections
 * @param {Map} input.naming  tokens/_naming.yaml, parsed
 * @returns {{css: string, manifest: object, errors: string[]}}
 */
export function buildCss({ collections, naming }) {
  const errors = [];
  const byName = new Map(collections.map((c) => [c.name, c]));

  // `draws_from` says which primitive collection a semantic one resolves
  // through. This build is its first reader.
  const drawsFrom = new Map(naming.get("draws_from") ?? new Map());
  const paletteName = drawsFrom.get("color");
  if (!paletteName || !byName.has(paletteName)) {
    return {
      css: "",
      manifest: {},
      errors: [
        `tokens/_naming.yaml: draws_from.color names "${paletteName ?? "(nothing)"}", which is ` +
          `not a collection under tokens/. The colour build cannot resolve a slot without it.`,
      ],
    };
  }
  const palette = byName.get(paletteName);
  const color = byName.get("color");
  if (!color) {
    return { css: "", manifest: {}, errors: [`tokens/color.yaml is missing — nothing to scope.`] };
  }

  /** property name -> where it came from. Also the duplicate-slug check. */
  const manifest = new Map();
  const origin = new Map(); // property -> a human name for the thing that claimed it

  const declare = (name, record, claimant) => {
    const held = origin.get(name);
    if (held !== undefined && held !== claimant) {
      errors.push(
        `two tokens slugify to one custom property "${name}": "${held}" and "${claimant}". ` +
          `The generator does not disambiguate and does not rename — give one of them a ` +
          `different name in Figma.`
      );
      return;
    }
    origin.set(name, claimant);
    manifest.set(name, record);
  };

  // The property a reference resolves to. A reference into the two-mode
  // palette needs the mode in the name; everything else carries it in scope.
  const refProperty = (target, mode, from) => {
    const slash = target.indexOf("/");
    const collection = target.slice(0, slash);
    const tokenPath = target.slice(slash + 1);
    if (collection === paletteName) {
      if (mode === null) {
        errors.push(
          `${from} is emitted unscoped but references "${target}" in the ${paletteName} ` +
            `collection, which has ${palette.modes.length} modes. There is no mode to pick.`
        );
        return null;
      }
      return property(collection, mode, tokenPath);
    }
    return property(collection, tokenPath);
  };

  // --- flat, unscoped: the palette and every single-mode collection --------

  const flat = [];

  // Both palettes, unconditionally, as two independent sets. color.md: "No
  // selector switches them." `hiddenFromPublishing` has no effect here — the
  // whole palette carries it, and the semantic layer resolves through it.
  for (const mode of palette.modes) {
    flat.push(``, `  /* ${paletteName} · ${mode} */`);
    for (const [tokenPath, token] of palette.tokens) {
      if (token.type !== "color") {
        errors.push(`${paletteName}/${tokenPath} is a ${token.type}, and the palette is colour.`);
        continue;
      }
      const name = property(paletteName, mode, tokenPath);
      declare(
        name,
        { token: `${paletteName}/${tokenPath}`, collection: paletteName, mode },
        `${paletteName}/${tokenPath} (${mode})`
      );
      flat.push(`  ${name}: ${cssColor(token.values.get(mode), token.alpha.get(mode) ?? 1)};`);
    }
  }

  // Every collection that does not vary by theme. `color` is the only one
  // that does besides the palette, and it is scoped below.
  for (const collection of collections) {
    if (collection === palette || collection === color) continue;
    if (collection.modes.length > 1) {
      errors.push(
        `${collection.name} has modes ${collection.modes.join(", ")} and no rule for emitting ` +
          `them. Only the palette is emitted flat with the mode in the name, and only ` +
          `color is scoped. See SPEC 0007 §4.`
      );
      continue;
    }
    const mode = collection.modes[0];
    flat.push(``, `  /* ${collection.name} */`);
    for (const [tokenPath, token] of collection.tokens) {
      const canonical = `${collection.name}/${tokenPath}`;
      const name = property(collection.name, tokenPath);
      const target = token.ref ? (token.ref.get(mode) ?? token.ref.get("default")) : null;

      let value = null;
      if (target) {
        const declared = drawsFrom.get(collection.name);
        if (declared && !target.startsWith(`${declared}/`)) {
          errors.push(
            `${canonical} references "${target}", but tokens/_naming.yaml declares ` +
              `draws_from.${collection.name} = "${declared}". Correct the binding in Figma, ` +
              `or the declaration.`
          );
        }
        const ref = refProperty(target, null, canonical);
        value = ref === null ? null : `var(${ref})`;
      } else if (token.type === "color") {
        value = cssColor(token.values.get(mode), token.alpha.get(mode) ?? 1);
      } else if (token.type === "number") {
        value = cssNumber(token.values.get(mode), tokenPath);
      } else if (token.type === "string") {
        const fallbacks = FONT_FALLBACKS.get(tokenPath);
        if (!fallbacks) {
          errors.push(
            `${canonical} is a string, and the only strings this build knows how to emit are ` +
              `the font families in FONT_FALLBACKS (tools/build-css.mjs). A family with no ` +
              `fallback stack would ship one typeface and no way to degrade — author its ` +
              `stack there, and record it in SPEC 0007 §3.`
          );
        } else {
          value = [`"${token.values.get(mode)}"`, ...fallbacks].join(", ");
        }
      } else {
        errors.push(`${canonical}: no rule for emitting a ${token.type}.`);
      }

      if (value === null) continue;
      declare(name, { token: canonical, collection: collection.name }, canonical);
      flat.push(`  ${name}: ${value};`);
    }
  }

  // --- per mode, in scope: slots, roles, composed shadows ------------------

  const steps = (group) =>
    [...palette.tokens.keys()]
      .filter((p) => p.startsWith(`${group}/`))
      .map((p) => p.slice(group.length + 1));

  const shadows = composeShadows(byName.get("effect"), errors);

  /** One scope's body, generated per mode. The name list must not vary by mode. */
  const scopeBody = (mode, { record }) => {
    const lines = [];
    const names = [];

    lines.push(`  /* slots — the five colours the system has */`);
    for (const [slot, group] of SLOT_BINDING) {
      const groupSteps = steps(group);
      if (groupSteps.length === 0) {
        errors.push(
          `slot "${slot}" is bound to the hue group "${group}", which is not in ` +
            `${paletteName}. Correct SLOT_BINDING in tools/build-css.mjs, or the palette.`
        );
        continue;
      }
      // All 13 steps, used or not, so a client who rebinds a slot gets a
      // complete ramp rather than the subset today's roles happen to touch.
      for (const step of groupSteps) {
        const name = property("slot", `${slot}/${step}`);
        names.push(name);
        if (record) {
          declare(name, { synthesised: "slot", slot, step, scoped: true }, `slot/${slot}/${step}`);
        }
        lines.push(`  ${name}: var(${property(paletteName, mode, `${group}/${step}`)});`);
      }
    }

    lines.push(``, `  /* semantic colour — every role, in every mode */`);
    for (const [tokenPath, token] of color.tokens) {
      const canonical = `color/${tokenPath}`;
      const name = property("color", tokenPath);
      const target = token.ref ? (token.ref.get(mode) ?? token.ref.get("default")) : null;
      const decision = slotOf(tokenPath, { hasRef: Boolean(target) });

      let value;
      if (!target) {
        // Figma cannot bind a variable and change its opacity, so the shadow
        // colours arrive as values. They differ per mode, so they are emitted
        // per mode. The cost is stated in color.md: rebinding the `primary`
        // slot leaves `shadow/primary` on the old brand colour.
        value = cssColor(token.values.get(mode), token.alpha.get(mode) ?? 1);
      } else {
        if (!target.startsWith(`${paletteName}/`)) {
          errors.push(
            `${canonical} (${mode}) references "${target}", which is not in ` +
              `"${paletteName}" — the collection tokens/_naming.yaml says color draws from.`
          );
          continue;
        }
        const [group, step] = target.slice(paletteName.length + 1).split("/");
        const wanted = expectedGroup(tokenPath, decision);
        if (wanted !== null && wanted !== group) {
          errors.push(
            `${canonical} (${mode}) resolves into the hue group "${group}", but its name puts ` +
              (decision.slot
                ? `it in the "${decision.slot}" slot, which is bound to "${wanted}"`
                : `it on "${wanted}"`) +
              `. Either the binding in Figma is wrong, or the role has outgrown its slot — ` +
              `see docs/foundations/color.md.`
          );
          continue;
        }
        value = decision.slot
          ? `var(${property("slot", `${decision.slot}/${step}`)})`
          : `var(${property(paletteName, mode, `${group}/${step}`)})`;
      }

      names.push(name);
      if (record) declare(name, { token: canonical, collection: "color", scoped: true }, canonical);
      lines.push(`  ${name}: ${value};`);
    }

    if (shadows.length > 0) {
      lines.push(``, `  /* shadows — cumulative, composed here (effects.md) */`);
      for (const { level, layers } of shadows) {
        const name = property("shadow", `elevation/${level}`);
        names.push(name);
        if (record) {
          declare(name, { synthesised: "shadow", level, scoped: true }, `shadow/elevation/${level}`);
        }
        lines.push(`  ${name}:`, layers.map((l) => `    ${l}`).join(",\n") + `;`);
      }
    }

    return { lines, names };
  };

  const light = scopeBody("light", { record: true });
  const dark = scopeBody("dark", { record: false });

  // The two scopes must declare the same names. If dark only redeclared the
  // roles that differ, a client override in light would inherit into it.
  if (light.names.join("\n") !== dark.names.join("\n")) {
    const missing = light.names.filter((n) => !dark.names.includes(n));
    const extra = dark.names.filter((n) => !light.names.includes(n));
    errors.push(
      `the light and dark scopes do not declare the same properties` +
        (missing.length ? `; dark is missing ${missing.join(", ")}` : ``) +
        (extra.length ? `; dark declares ${extra.join(", ")} that light does not` : ``) +
        `.`
    );
  }

  const source = palette.source;
  const css = [
    `/* Stylos design tokens. GENERATED by tools/build-css.mjs — do not edit.`,
    ` *`,
    ` * Projected from tokens/*.yaml, imported ${source.imported} from ${source.figmaFile}.`,
    ` * The name rule, the layering and the theme switch are specified by`,
    ` * docs/specs/0007-tokens-to-css.md. Every name in here is listed in`,
    ` * tokens.json beside the canonical token path it came from.`,
    ` */`,
    ``,
    `:root {`,
    ...flat.slice(1),
    `}`,
    ``,
    `:root {`,
    `  color-scheme: light;`,
    ``,
    ...light.lines,
    `}`,
    ``,
    // The dark body is emitted twice, byte-identical. A selector list would
    // be shorter, and an override targeting one of its two selectors would
    // silently miss the other.
    `@media (prefers-color-scheme: dark) {`,
    `  :root:not([data-theme="light"]) {`,
    `    color-scheme: dark;`,
    ``,
    ...dark.lines.map((l) => (l === "" ? "" : `  ${l}`)),
    `  }`,
    `}`,
    ``,
    `:root[data-theme="dark"] {`,
    `  color-scheme: dark;`,
    ``,
    ...dark.lines,
    `}`,
    ``,
  ].join("\n");

  checkEveryVarResolves(css, manifest, errors);
  checkEveryTokenEmitted(collections, manifest, errors);

  return {
    css,
    manifest: {
      generator: "tools/build-css.mjs",
      spec: "docs/specs/0007-tokens-to-css.md",
      prefix: PREFIX,
      source: {
        figma_file: source.figmaFile,
        figma_key: source.figmaKey,
        imported: source.imported,
      },
      properties: Object.fromEntries(manifest),
    },
    errors,
  };
}

/**
 * `elevation N` = layers 1…N in `shadow/color/base`, then layer N repeated in
 * `shadow/color/primary` — N + 1 layers. One layer at step k is
 * `0 elevation(k) elevation(k) spread(k) <colour>`: X is always 0 and blur
 * equals the Y offset, which is why there is no blur token.
 *
 * Composed here rather than exported, per effects.md: "A generator that emits
 * one box-shadow layer per level produces the wrong thing at every level
 * above 1." The colours are referenced, never inlined, so they follow the scope.
 */
export function composeShadows(effect, errors) {
  if (!effect) return [];

  const scale = (kind) =>
    new Map(
      [...effect.tokens]
        .filter(([p]) => p.startsWith(`shadow/${kind}/level-`))
        .map(([p, t]) => [Number(p.slice(`shadow/${kind}/level-`.length)), t.values.get("default")])
    );

  const elevation = scale("elevation");
  const spread = scale("spread");

  const levels = [...elevation.keys()].sort((a, b) => a - b);
  const missing = levels.filter((n) => !spread.has(n));
  if (missing.length) {
    errors.push(
      `effect: shadow/elevation has level${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ` +
        `with no matching shadow/spread. A layer needs both.`
    );
    return [];
  }
  const orphanSpread = [...spread.keys()].filter((n) => !elevation.has(n));
  if (orphanSpread.length) {
    errors.push(
      `effect: shadow/spread has level${orphanSpread.length > 1 ? "s" : ""} ` +
        `${orphanSpread.join(", ")} with no matching shadow/elevation.`
    );
    return [];
  }

  const layer = (n, colour) =>
    `0 ${elevation.get(n)}px ${elevation.get(n)}px ${spread.get(n)}px ` +
    `var(${property("color", `shadow/${colour}`)})`;

  return levels.map((level) => ({
    level,
    layers: [
      ...levels.filter((n) => n <= level).map((n) => layer(n, "base")),
      layer(level, "primary"),
    ],
  }));
}

/** No property may reference a name the file does not define. */
function checkEveryVarResolves(css, manifest, errors) {
  const unresolved = new Set();
  for (const [, name] of css.matchAll(/var\((--[a-z0-9_-]+)\)/g)) {
    if (!manifest.has(name)) unresolved.add(name);
  }
  for (const name of unresolved) {
    errors.push(`${name} is referenced but never declared. The output would resolve to nothing.`);
  }
}

/**
 * Every token becomes a custom property. There is no allowlist and no
 * pruning by current usage — that would make the CSS a function of the
 * component set instead of the token set (SPEC 0007 §5).
 */
function checkEveryTokenEmitted(collections, manifest, errors) {
  const emitted = new Set();
  for (const record of manifest.values()) if (record.token) emitted.add(record.token);

  for (const collection of collections) {
    for (const tokenPath of collection.tokens.keys()) {
      const canonical = `${collection.name}/${tokenPath}`;
      if (!emitted.has(canonical)) {
        errors.push(`${canonical} is in tokens/ and did not reach the CSS.`);
      }
    }
  }
}

export function main(root, argv) {
  const outIndex = argv.indexOf("--out");
  const out = outIndex === -1 ? OUT_DIR : argv[outIndex + 1];
  const toStdout = argv.includes("--stdout");

  if (outIndex !== -1 && !out) throw new Error(`--out needs a directory`);
  for (const arg of argv) {
    if (arg.startsWith("--") && !["--out", "--stdout"].includes(arg)) {
      throw new Error(`Unknown option "${arg}"`);
    }
  }

  // The CSS is a build result with no committed baseline, so it cannot tell
  // whether a token disappeared. What it can do is refuse to project a set
  // that does not verify.
  const verified = runCheck({ root });
  if (!verified.ok) {
    for (const e of verified.errors) console.error(`FAIL  ${e}`);
    console.error(
      `\nThe canonical token set does not verify, so there is nothing safe to project. ` +
        `Fix the above and re-run: npm run tokens:check`
    );
    return 1;
  }

  const { css, manifest, errors } = buildCss({
    collections: loadCanonical(root),
    naming: readNaming(root),
  });

  if (errors.length) {
    for (const e of errors) console.error(`FAIL  ${e}`);
    console.error(`\nNothing written.`);
    return 1;
  }

  if (toStdout) {
    process.stdout.write(css);
    return 0;
  }

  const dir = path.isAbsolute(out) ? out : path.join(root, out);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "tokens.css"), css, "utf8");
  writeFileSync(path.join(dir, "tokens.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const properties = Object.keys(manifest.properties).length;
  console.error(
    `OK: ${properties} custom properties → ${path.join(out, "tokens.css")} and tokens.json.`
  );
  return 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  try {
    process.exit(main(root, process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
