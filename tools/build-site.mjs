#!/usr/bin/env node
// Builds the whole publishable tree.
//
//   npm run build     # → build/
//
// The three renderers each stay runnable on their own — `npm run registry:view`
// while editing YAML is faster than rebuilding 101 pages — but only this script
// produces something that can be uploaded, because only it copies assets/ in.
// A page built without the fonts still renders; it just falls back to the
// system stack, and that is a footgun worth removing from the publish path.
//
// It calls the renderers rather than spawning them: one process, one read of
// tokens/ and of the registry, and an error that stops the build instead of
// leaving half a tree behind.
//
// The output is derived. build/ stays gitignored and is rebuilt, never edited.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry } from "./lib/registry.mjs";
import { createTokenResolver } from "./lib/sizing.mjs";
import { loadTheme, themeCss } from "./lib/theme.mjs";
import { buildViewData, renderView } from "./build-registry-view.mjs";
import { buildPages, readLogo } from "./build-component-page.mjs";
import { renderHome, hasColumn } from "./build-home.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "build");

function write(relative, contents) {
  const file = path.join(out, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

const entries = loadRegistry(root);
const theme = loadTheme(root);
const logo = readLogo(root);
const generated = new Date().toISOString().slice(0, 10);

if (theme.missing.length > 0) {
  console.warn(`theme: ${theme.missing.length} token(s) did not resolve: ${theme.missing.join(", ")}`);
}
if (!logo) console.warn("assets/logo.svg is missing — building without the wordmark");

// A stale page from a component that has since been renamed would otherwise
// sit in the tree forever and be published with the rest.
rmSync(out, { recursive: true, force: true });

// README.md documents the directory for whoever opens the repository; it is
// not part of the site.
cpSync(path.join(root, "assets"), path.join(out, "assets"), {
  recursive: true,
  filter: (source) => path.basename(source) !== "README.md",
});

write("index.html", renderHome({ entries, theme, logo, generated, column: hasColumn(root) }));
// registry.html sits at the root of build/, so its font URLs need no prefix.
write("registry.html", renderView(buildViewData(root, entries), { themeCss: themeCss(theme, { prefix: "" }), logo }));

const pages = buildPages(entries, {
  generated,
  resolveToken: createTokenResolver(root),
  theme,
  logo,
});
for (const [relative, html] of pages) write(path.join("components", relative), html);

console.log(
  `build/ — index.html, registry.html, ${pages.size - 1} component pages, assets/` +
    (hasColumn(root) ? "" : "\nassets/column.png is absent; the home page is built without the capital")
);

