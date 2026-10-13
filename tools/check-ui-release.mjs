#!/usr/bin/env node
// Stage 5 acceptance evidence, derived from PLAN.md and the component registry.
// No release is cut and no version is bumped by this command.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { loadRegistry, slugPath } from "./lib/registry.mjs";
import { readPlan, waveMembers } from "./lib/plan.mjs";
import { builtComponents, pascalName, renderProps } from "./build-ui-types.mjs";
import { releaseCases } from "./lib/ui-release.mjs";
import { defaultAssignment, sampleHtml, wrapTablePreview } from "./lib/preview.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = path.join(root, "build/ui-release");
const entries = loadRegistry(root);
const core = new Set(waveMembers(readPlan(root), entries).flatMap(wave => wave.ids));
const implemented = new Set(builtComponents(root, entries).map(entry => entry.id));
const components = entries.filter(entry => core.has(entry.id)).map(entry => {
  assert.ok(implemented.has(entry.id), `Core component is missing: ${entry.id}`);
  const slug = slugPath(entry.id);
  assert.equal(readFileSync(path.join(root, `packages/ui/src/components/${slug}/props.ts`), "utf8"), renderProps(entry),
    `${entry.id}: generated props are stale`);
  for (const file of [`packages/ui/dist/css/${slug}.css`, `packages/ui/dist/package/components/${slug}/${pascalName(entry.id)}.svelte`]) {
    assert.ok(existsSync(path.join(root, file)), `Build artifact is missing: ${file}`);
  }
  assert.equal(fileURLToPath(import.meta.resolve(`@stylos/ui/css/${slug}.css`)), path.join(root, `packages/ui/dist/css/${slug}.css`));
  return { id: entry.id, name: pascalName(entry.id), selector: `.stylos-${slug}`, cases: releaseCases(entry) };
});
const cases = components.reduce((total, component) => total + component.cases.length, 0);
const hash = createHash("sha256");
function fingerprint(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) fingerprint(file);
    else { hash.update(path.relative(root, file)); hash.update(readFileSync(file)); }
  }
}
for (const directory of ["packages/ui/src", "tokens", "tools", "apps/workshop/stories/fixtures"]) fingerprint(path.join(root, directory));
hash.update(readFileSync(path.join(root, "package-lock.json")));
hash.update(JSON.stringify(components));
const sourceFingerprint = hash.digest("hex");
const manifest = { components, cases, sourceFingerprint };
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const independent = components.map(component => {
  const entry = entries.find(entry => entry.id === component.id);
  const assignment = defaultAssignment(entry);
  for (const property of entry.api) {
    if (property.name === "accessible name") assignment[property.name] = "Acceptance sample";
    if (property.name === "name" && entry.id === "Icon") assignment.name = "add";
  }
  let html = wrapTablePreview(entry, sampleHtml(entry, assignment));
  if (entry.id.startsWith("Dropdown Item")) html = `<ul role="${entry.id === "Dropdown Item Default" ? "listbox" : "group"}" aria-label="Acceptance options">${html}</ul>`;
  return `<section data-component="${escape(entry.id)}"><h2>${escape(entry.id)}</h2>${html}</section>`;
}).join("\n");
writeFileSync(path.join(out, "independent.html"), `<!doctype html><html lang="en" data-theme="light"><head>
<meta charset="utf-8"><title>Stylos core — CSS without Svelte</title>
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/fonts.css">
${components.map(component => `<link rel="stylesheet" href="/css/${slugPath(component.id)}.css">`).join("\n")}
<style>body{margin:24px}section{margin-bottom:24px}h1,h2{font:18px system-ui}</style>
</head><body><main><h1>Core components — no JavaScript</h1>${independent}</main></body></html>`);

// The only exported paths needed by this smoke page. Missing assets fail here,
// before the browser can silently substitute a system font or unstyled markup.
const resources = new Map([
  ["/manifest.json", path.join(out, "manifest.json")],
  ["/independent.html", path.join(out, "independent.html")],
  ["/tokens.css", fileURLToPath(import.meta.resolve("@stylos/ui/tokens.css"))],
  ["/fonts.css", fileURLToPath(import.meta.resolve("@stylos/ui/fonts.css"))],
  ...components.map(component => [`/css/${slugPath(component.id)}.css`, fileURLToPath(import.meta.resolve(`@stylos/ui/css/${slugPath(component.id)}.css`))]),
]);
const fonts = readFileSync(resources.get("/fonts.css"), "utf8");
for (const [, font] of fonts.matchAll(/url\(["']?((?:\.\/)?assets\/fonts\/[^"')]+)["']?\)/g)) {
  const file = path.resolve(path.dirname(resources.get("/fonts.css")), font);
  assert.ok(existsSync(file), `Font artifact is missing: ${font}`);
  resources.set(`/${font.replace(/^\.\//, "")}`, file);
}
assert.ok([...resources.keys()].some(url => url.endsWith(".woff2")), "Font stylesheet has no resolvable assets");
const serve = process.argv.includes("--serve");
const server = await createServer({
  configFile: false, root: path.join(root, "tools/ui-release"),
  plugins: [svelte({ configFile: false }), {
    name: "stylos-release-evidence",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, "http://127.0.0.1").pathname;
        if (pathname === "/report" && req.method === "POST") {
          if (req.headers.origin !== "http://127.0.0.1:4174") { res.statusCode = 403; res.end(); return; }
          let body = "";
          req.on("data", chunk => { body += chunk; if (body.length > 2_000_000) req.destroy(); });
          req.on("end", () => {
            try {
              const report = JSON.parse(body);
              assert.equal(report.components, components.length);
              assert.equal(report.expected, cases * 2);
              assert.equal(report.sourceFingerprint, sourceFingerprint);
              assert.ok(Array.isArray(report.errors) && Array.isArray(report.a11y));
              writeFileSync(path.join(out, "browser.json"), JSON.stringify(report, null, 2));
              res.end("Saved");
            } catch { res.statusCode = 400; res.end("Invalid report"); }
          });
          return;
        }
        const file = resources.get(pathname);
        if (!file) { next(); return; }
        res.setHeader("Content-Type", ({ ".json": "application/json", ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2" })[path.extname(file)]);
        res.end(readFileSync(file));
      });
    },
  }],
  server: { host: "127.0.0.1", port: 4174, strictPort: true, middlewareMode: !serve, hmr: false, ws: false, fs: { allow: [root] } },
});
try {
  if (serve) await server.listen();
  const { default: Case } = await server.ssrLoadModule("/Case.svelte");
  const { render } = await server.ssrLoadModule("svelte/server");
  for (const component of components) {
    for (let index = 0; index < component.cases.length; index++) {
      const { body } = render(Case, { props: { name: component.name, args: component.cases[index] } });
      assert.ok(body.includes(component.selector.slice(1)), `${component.id}, case ${index}: component markup is absent`);
    }
  }
  const report = { components: components.length, cases, sourceFingerprint, checks: ["core coverage", "fresh props", "built wrappers", "CSS export resolution", "font assets", "server rendering"],
    browserEvidence: "Run npm run ui:verify:browser and use Run browser checks; results are saved to build/ui-release/browser.json." };
  writeFileSync(path.join(out, "build.json"), JSON.stringify(report, null, 2));
  console.log(`OK: ${components.length} core components, ${cases} server-rendered cases; CSS-only page and manifest in build/ui-release/.`);
  if (process.argv.includes("--check-browser")) {
    const browser = JSON.parse(readFileSync(path.join(out, "browser.json"), "utf8"));
    assert.equal(browser.sourceFingerprint, sourceFingerprint, "Browser evidence is stale: run the browser checks again");
    assert.equal(browser.rendered, cases * 2, "Browser rendering is incomplete");
    assert.deepEqual(browser.errors, [], "Browser rendering failed");
    assert.deepEqual(browser.a11y, [], "axe findings require review before acceptance");
    console.log(`OK: current browser rendering, no axe violations; ${browser.incomplete.length} incomplete axe checks and screen-reader evaluation require manual review.`);
  }
  if (serve) console.log("Browser acceptance: http://127.0.0.1:4174");
} catch (error) {
  await server.close();
  throw error;
} finally {
  if (!serve) await server.close();
}
