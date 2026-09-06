// The shared chrome — SPEC 0011 §3.
//
// One header and one footer for every generated page, so the tree reads as a
// site rather than as three tools sharing a directory. The header carries no
// script — the component pages assert they have none — and every link in it is
// derived: Storybook appears only when the workshop is built into the tree,
// Figma only when figma/README.md names a library, GitHub only when
// package.json records the repository. A tree built from less is a smaller
// tree, never one with dead links.
//
// `prefix` is how deep the page sits under build/ — the same convention
// themeCss uses — so the links are relative and the tree works from any
// mount point, file:// included.

import { readFileSync } from "node:fs";
import path from "node:path";

import { loadTheme, themeCss } from "./theme.mjs";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const CHROME_CSS = `
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
  flex-wrap: wrap;
  padding-block: 1.1rem;
  border-bottom: 1px solid var(--rule);
}
.site-header.bleed { padding-inline: 28px; }
.site-header .brand { display: flex; align-items: center; }
.site-header .brand .logo { display: block; width: 96px; height: auto; color: var(--brand); }
.site-header .brand .brand-name { font-weight: 650; letter-spacing: .02em; color: var(--fg); }
.site-header nav { display: flex; align-items: baseline; gap: .35rem 1.4rem; flex-wrap: wrap; margin-left: auto; }
.site-header nav a {
  font-size: var(--text-meta);
  color: var(--fg-quiet);
  text-decoration: none;
  letter-spacing: .01em;
}
.site-header nav a:hover { color: var(--accent); }
.site-header nav a[aria-current="page"] { color: var(--fg); font-weight: 600; }
.site-header nav a.ext::after { content: " \\2197"; font-size: .85em; color: var(--fg-faint); }

.site-footer {
  margin-top: auto;
  padding-block: 2rem 2.5rem;
  border-top: 1px solid var(--rule);
  color: var(--fg-faint);
  font-size: var(--text-small);
  line-height: 1.6;
}
.site-footer.bleed { padding-inline: 28px; }
.site-footer p { margin: .2rem 0; }
.site-footer a { color: var(--fg-quiet); }
.site-footer .mono, .site-header .mono { font-family: var(--font-mono); font-size: .92em; }
@media print {
  .site-header, .site-footer { display: none; }
}
`;

/**
 * The pages of the site, in the order the header lists them. `href` is
 * relative to build/; `page` is the key `active` names.
 */
const NAV = [
  ["home", "Home", "index.html"],
  ["components", "Components", "components/index.html"],
  ["registry", "Registry", "registry.html"],
];

/**
 * @param {object} options
 * @param {string} options.prefix     depth under build/ — "", "../", "../../"
 * @param {string} options.active     which NAV page this is, or "" for none
 * @param {string} options.logo       inline SVG wordmark, or ""
 * @param {boolean} options.storybook whether build/storybook/ is in the tree
 * @param {string|null} options.figmaUrl  the Components library, or null
 * @param {string|null} options.repoUrl   the repository, or null
 */
export function renderSiteHeader({
  prefix = "",
  active = "",
  logo = "",
  storybook = false,
  figmaUrl = null,
  repoUrl = null,
  bleed = false,
  // The front page carries the wordmark in its cover and turns this off —
  // one logo per page, and the cover's is the bigger claim.
  brand = true,
} = {}) {
  const links = NAV.map(
    ([page, label, href]) =>
      `<a href="${esc(`${prefix}${href}`)}"${page === active ? ' aria-current="page"' : ""}>${label}</a>`
  );
  if (storybook) links.push(`<a href="${esc(`${prefix}storybook/`)}">Storybook</a>`);
  if (figmaUrl) links.push(`<a class="ext" href="${esc(figmaUrl)}">Figma</a>`);
  if (repoUrl) links.push(`<a class="ext" href="${esc(repoUrl)}">GitHub</a>`);

  const brandLink = brand
    ? `<a class="brand" href="${esc(`${prefix}index.html`)}" aria-label="Stylos — home">${logo || `<span class="brand-name">Stylos</span>`}</a>`
    : "";
  return `<header class="site-header${bleed ? " bleed" : ""}">
${brandLink}
<nav aria-label="Site">${links.join("\n")}</nav>
</header>`;
}

/**
 * The footer states provenance — what this tree is derived from — because a
 * generated site's honesty is its build story.
 */
export function renderSiteFooter({ generated = "", version = null, repoUrl = null, bleed = false } = {}) {
  const lines = [
    `<p>Stylos${version ? ` <span class="mono">v${esc(version)}</span>` : ""} — a design system for dense, desktop-oriented web product interfaces.</p>`,
    `<p>Generated${generated ? ` ${esc(generated)}` : ""} from <span class="mono">docs/components/registry/</span>, <span class="mono">tokens/</span> and <span class="mono">PLAN.md</span>. Every colour, measure and count on these pages is resolved from the record on every build; nothing is transcribed by hand.</p>`,
  ];
  if (repoUrl) lines.push(`<p><a href="${esc(repoUrl)}">${esc(repoUrl.replace(/^https?:\/\//, ""))}</a></p>`);
  return `<footer class="site-footer${bleed ? " bleed" : ""}">
${lines.join("\n")}
</footer>`;
}

/** The theme and the wordmark, read from the repository at build time. */
export function loadChrome(root, { prefix = "" } = {}) {
  const theme = loadTheme(root);
  if (theme.missing.length > 0) {
    console.warn(`theme: ${theme.missing.length} token(s) did not resolve: ${theme.missing.join(", ")}`);
  }
  let logo = "";
  try {
    logo = readFileSync(path.join(root, "assets/logo.svg"), "utf8").trim().replace(/^<\?xml[^>]*>\s*/, "");
    logo = logo.replace("<svg ", '<svg class="logo" ');
  } catch {
    // The wordmark is decoration. A build without it is a build without it.
  }
  return { themeCss: themeCss(theme, { prefix }), logo };
}
