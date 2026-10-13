#!/usr/bin/env node
// Stage 5 acceptance evidence, derived from PLAN.md and the component registry.
// No release is cut and no version is bumped by this command.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { loadRegistry, slugPath } from "./lib/registry.mjs";
import { readPlan, waveMembers } from "./lib/plan.mjs";
import { builtComponents, pascalName, renderProps } from "./build-ui-types.mjs";
import { releaseCases, markupReader, variantChecks } from "./lib/ui-release.mjs";
import { verifyVariantCase } from "./ui-release/checks.mjs";
import { validateReport, readReportBody } from "./lib/ui-release-report.mjs";
import { esc as escape } from "./build-component-page.mjs";
import { defaultAssignment, sampleHtml, wrapTablePreview } from "./lib/preview.mjs";

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  // Always regenerate before hashing or serving; a current source hash cannot
  // certify an old dist tree. Both render passes use this fresh packaged output.
  console.log("Building current @stylos/ui artifacts for acceptance...");
  execFileSync("npm", ["run", "ui:build"], { cwd: root, stdio: "pipe" });
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
    return { id: entry.id, name: pascalName(entry.id), selector: `.stylos-${slug}`, variantChecks: variantChecks(entry), cases: releaseCases(entry) };
  });
  const cases = components.reduce((total, component) => total + component.cases.length, 0);
  function inputFingerprint() {
  const hash = createHash("sha256");
  function fingerprint(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) fingerprint(file);
      else { hash.update(path.relative(root, file)); hash.update(readFileSync(file)); }
    }
  }
  for (const directory of ["packages/ui/src", "packages/ui/dist", "tokens", "tools", "apps/workshop/stories/fixtures", "assets/fonts"]) fingerprint(path.join(root, directory));
  for (const file of ["package-lock.json", "figma/text-styles.yaml"]) hash.update(readFileSync(path.join(root, file)));
  hash.update(JSON.stringify(components));
  hash.update(readFileSync(path.join(out, "independent.html")));
  return hash.digest("hex");
  }
  mkdirSync(out, { recursive: true });

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
  const sourceFingerprint = inputFingerprint();
  const manifest = { components, cases, sourceFingerprint };
  writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
  // Serve immutable bytes for this run; mid-run changes invalidate report upload.
  const resourceBytes = new Map([...resources].map(([url, file]) => [url, readFileSync(file)]));
  const serve = process.argv.includes("--serve");
  const server = await createServer({
    configFile: false, root: path.join(root, "tools/ui-release"),
    resolve: { alias: [{ find: /^@stylos\/ui$/, replacement: path.join(root, "packages/ui/dist/package/index.js") }] },
    plugins: [svelte({ configFile: false }), {
      name: "stylos-release-evidence",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = new URL(req.url, "http://127.0.0.1").pathname;
          if (pathname === "/report" && req.method === "POST") {
            if (req.headers.origin !== "http://127.0.0.1:4174") { res.statusCode = 403; res.end(); return; }
              try {
                const report = JSON.parse(await readReportBody(req));
                validateReport(report, manifest);
                if (inputFingerprint() !== sourceFingerprint) throw new Error("Acceptance inputs changed during the run; restart browser acceptance.");
                writeFileSync(path.join(out, "browser.json"), JSON.stringify(report, null, 2));
                res.end("Saved");
              } catch (error) { res.statusCode = error.status ?? 400; res.end(error.message); }
            return;
          }
          const file = resources.get(pathname);
          if (!file) { next(); return; }
          res.setHeader("Content-Type", ({ ".json": "application/json", ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2" })[path.extname(file)]);
          res.end(resourceBytes.get(pathname));
        });
      },
    }],
    server: { host: "127.0.0.1", port: 4174, strictPort: true, middlewareMode: !serve, hmr: false,
      ws: serve ? { host: "127.0.0.1", port: 4174 } : false, forwardConsole: false, fs: { allow: [root] } },
  });
  try {
    if (serve) await server.listen();
    const { default: Case } = await server.ssrLoadModule("/Case.svelte");
    const { render } = await server.ssrLoadModule("svelte/server");
    for (const component of components) {
      for (let index = 0; index < component.cases.length; index++) {
        const { body } = render(Case, { props: { name: component.name, args: component.cases[index] } });
        try { verifyVariantCase(component, component.cases[index], markupReader(body)); }
        catch (error) { throw new Error(`${component.id}, case ${index}: ${error.message}`); }
      }
    }
    const report = { components: components.length, cases, sourceFingerprint, checks: ["core coverage", "fresh props", "built wrappers", "CSS export resolution", "font assets", "server rendering"],
      browserEvidence: "Run npm run ui:verify:browser and use Run browser checks; results are saved to build/ui-release/browser.json." };
    writeFileSync(path.join(out, "build.json"), JSON.stringify(report, null, 2));
    console.log(`OK: ${components.length} core components, ${cases} server-rendered cases; CSS-only page and manifest in build/ui-release/.`);
    if (process.argv.includes("--check-browser")) {
      const evidence = path.join(out, "browser.json");
      assert.ok(existsSync(evidence), "Browser evidence is missing. Run npm run ui:verify:browser and record browser checks.");
      let browser;
      try { browser = JSON.parse(readFileSync(evidence, "utf8")); }
      catch { throw new Error("Browser evidence is unreadable. Run npm run ui:verify:browser and record fresh browser checks."); }
      validateReport(browser, manifest, true);
      console.log(`OK: current browser rendering, no axe violations; ${browser.incomplete.length} incomplete axe checks and screen-reader evaluation require manual review.`);
    }
    if (serve) console.log("Browser acceptance: http://127.0.0.1:4174");
  } catch (error) {
    await server.close();
    throw error;
  } finally {
    if (!serve) await server.close();
  }
}
main().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
