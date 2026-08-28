// The generated views' theme, derived from tokens/ rather than hand-picked.
//
// SPEC 0002 §4.3 said not to hand-code Stylos colours into the registry view,
// because "once the CSS build exists this view is its natural first consumer,
// and that is worth more as a real test than a styled table is worth now".
// This is that consumer, and the rule it was protecting is kept: nothing here
// is a copied hex. Every value is an address into tokens/, resolved on every
// build by the same loader tokens-report.mjs uses, so a tweak in Figma reaches
// the pages at the next `npm run build` and never disagrees with the record.
//
// It is a theme, not an implementation. The pages are still plain HTML written
// by hand — no Stylos component is used, none is implied, and nothing here
// should be read as the CSS build of PLAN.md Stage 3.
//
// Two things stay deliberately outside the token set: the fallback font stacks
// (tokens name a family, not what to do when it is missing) and the layout
// itself. Everything else — colour, radius, type scale, family — is resolved.

import { loadCanonical, resolve } from "./tokens.mjs";

/**
 * CSS custom property → the `color` token that answers for it, in both modes.
 *
 * The names on the left are the ones the two builders already used, so the
 * migration is the value side alone. Where a role had no obvious token the
 * closest semantic one is named rather than a new palette entry invented:
 * `--rule` is border/secondary because a hairline is the quiet border, and
 * border/default is strong enough to be the emphatic one.
 */
export const COLOR_ROLES = new Map([
  ["bg", "background/base"],
  ["bg-sunken", "background/secondary"],
  ["bg-raised", "background/tertiary"],
  ["selected", "background/primary"],
  ["fg", "text/base"],
  ["fg-quiet", "text/secondary"],
  ["fg-faint", "text/tertiary"],
  ["fg-disabled", "text/disabled"],
  // What is legible *on* --brand: near-white over indigo in light, near-black
  // over the pale indigo dark mode uses. One token answers for both.
  ["fg-on-brand", "text/inverted"],
  ["accent", "text/primary"],
  ["brand", "surface/bold/primary/default"],
  ["rule", "border/secondary"],
  ["rule-strong", "border/default"],
  ["rule-accent", "border/primary"],
  ["ok", "text/success"],
  ["warn", "text/warning"],
  ["bad", "text/danger"],
  ["info", "text/special/cyan"],
]);

/** Radius names, as `--radius-*`. `round` is the pill, 1000. */
const RADII = new Map([
  ["xs", "extra small"],
  ["sm", "small"],
  ["md", "medium"],
  ["lg", "large"],
  ["xl", "extra large"],
  ["round", "round"],
]);

/**
 * The type scale the pages use, as `--text-*`, addressed into `font`.
 *
 * A page needs seven steps, not nineteen. These are the seven, named by the
 * job rather than by the number so that moving one is a one-line change here.
 */
const TYPE_SCALE = new Map([
  ["micro", "size/0_625"],
  ["small", "size/0_750"],
  ["meta", "size/0_875"],
  ["body", "size/1_000"],
  ["lead", "size/1_125"],
  ["section", "size/1_500"],
  ["title", "size/2_500"],
]);

/** What a family falls back to. Tokens name a family; they cannot name this. */
const FALLBACKS = {
  sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`,
};

/** The four subsets under assets/fonts/, and the range each one covers. */
export const FONT_FACES = [
  {
    family: "Georama",
    weight: "100 900",
    stretch: "100%",
    file: "georama-latin.woff2",
    range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    family: "Georama",
    weight: "100 900",
    stretch: "100%",
    file: "georama-latin-ext.woff2",
    range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  },
  {
    family: "JetBrains Mono",
    weight: "400 700",
    file: "jetbrains-mono-latin.woff2",
    range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    family: "JetBrains Mono",
    weight: "400 700",
    file: "jetbrains-mono-latin-ext.woff2",
    range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  },
];

/** `#5752f1` at .04 → `rgb(87 82 241 / 0.04)`. A full-alpha colour is left alone. */
function css(value, alpha) {
  if (typeof value !== "string" || !value.startsWith("#")) return String(value);
  if (alpha >= 1) return value;
  const hex = value.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 1000) / 1000})`;
}

/**
 * Resolve the theme against the canonical token set.
 *
 * A role whose token is missing is dropped rather than defaulted: the CSS
 * carries a literal fallback for every variable it reads, so a partial token
 * set degrades to a plain page instead of an unstyled one. `missing` names
 * whatever was dropped, and the builders print it.
 *
 * @returns {{light: Map<string,string>, dark: Map<string,string>,
 *            radius: Map<string,number>, text: Map<string,number>,
 *            fonts: {sans: string, mono: string}, missing: string[],
 *            imported: string}}
 */
export function loadTheme(root) {
  const collections = loadCanonical(root);
  const missing = [];

  const at = (collection, name, mode) => {
    try {
      const { value, alpha } = resolve(collections, collection, name, mode);
      return value === undefined ? undefined : css(value, alpha);
    } catch {
      missing.push(`${collection}/${name}`);
      return undefined;
    }
  };

  const colours = (mode) => {
    const out = new Map();
    for (const [role, name] of COLOR_ROLES) {
      const value = at("color", name, mode);
      if (value !== undefined) out.set(role, value);
    }
    return out;
  };

  const numbers = (collection, entries) => {
    const out = new Map();
    for (const [role, name] of entries) {
      const value = at(collection, name, "default");
      if (value !== undefined) out.set(role, Number(value));
    }
    return out;
  };

  const family = (name) => at("font", `family/${name}`, "default");
  const quoted = (value) => (/^[A-Za-z][A-Za-z0-9]*$/.test(value) ? value : `"${value}"`);

  const sans = family("normal");
  const mono = family("code");

  return {
    light: colours("light"),
    dark: colours("dark"),
    radius: numbers("radius", RADII),
    text: numbers("font", TYPE_SCALE),
    fonts: {
      sans: sans ? `${quoted(sans)}, ${FALLBACKS.sans}` : FALLBACKS.sans,
      mono: mono ? `${quoted(mono)}, ${FALLBACKS.mono}` : FALLBACKS.mono,
    },
    missing: [...new Set(missing)],
    imported: collections.find((c) => c.name === "color")?.source.imported ?? "",
  };
}

/**
 * The theme as CSS: `@font-face` for the self-hosted subsets, then the custom
 * properties for light, then the ones that differ in dark.
 *
 * `prefix` is how deep the page sits under build/ — `""` for build/index.html,
 * `"../../"` for build/components/table/td-text.html. The fonts are one shared
 * copy at build/assets/fonts/ rather than base64 in every page, because 101
 * pages × 116 KB is a 12 MB output for four files. A page copied out of the
 * tree on its own loses them and falls back to the system stack; the whole
 * tree copied or zipped keeps working, which is the case that was promised.
 */
export function themeCss(theme, { prefix = "" } = {}) {
  const faces = FONT_FACES.map(
    (face) => `@font-face {
  font-family: "${face.family}";
  font-style: normal;
  font-weight: ${face.weight};${face.stretch ? `\n  font-stretch: ${face.stretch};` : ""}
  font-display: swap;
  src: url("${prefix}assets/fonts/${face.file}") format("woff2");
  unicode-range: ${face.range};
}`
  ).join("\n");

  const lines = [];
  for (const [role, value] of theme.light) lines.push(`  --${role}: ${value};`);
  for (const [role, value] of theme.radius) lines.push(`  --radius-${role}: ${value}px;`);
  for (const [role, value] of theme.text) lines.push(`  --text-${role}: ${value}px;`);
  lines.push(`  --font-sans: ${theme.fonts.sans};`);
  lines.push(`  --font-mono: ${theme.fonts.mono};`);

  const dark = [];
  for (const [role, value] of theme.dark) {
    if (theme.light.get(role) !== value) dark.push(`    --${role}: ${value};`);
  }

  return `${faces}

/* Resolved from tokens/ on every build — see tools/lib/theme.mjs.
   Colour imported from Figma ${theme.imported || "(date unrecorded)"}. */
:root {
  color-scheme: light dark;
${lines.join("\n")}
}
@media (prefers-color-scheme: dark) {
  :root {
${dark.join("\n")}
  }
}
`;
}
