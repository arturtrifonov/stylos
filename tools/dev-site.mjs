#!/usr/bin/env node
// Local documentation preview with rebuilds and browser reloads. No dependencies.
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, "build");
const host = "127.0.0.1";
const port = Number(process.env.PORT ?? 4173);
const clients = new Set();
const watchers = [];
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const reload = `<script>
  const previewEvents = new EventSource('/__preview/events');
  previewEvents.addEventListener('reload', () => location.reload());
</script>`;

let building;
let dirty = true;
let timer;

function rebuild() {
  if (building) return building;
  building = (async () => {
    while (dirty) {
      dirty = false;
      const code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ["tools/build-site.mjs"], {
          cwd: root,
          stdio: "inherit",
        });
        child.once("error", reject);
        child.once("exit", resolve);
      });
      if (code !== 0) throw new Error(`Site build failed (${code})`);
    }
    for (const client of clients) client.write("event: reload\ndata: ready\n\n");
  })().finally(() => { building = undefined; });
  return building;
}

function changed() {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(() => rebuild().catch(console.error), 150);
}

for (const directory of ["docs", "tokens", "assets", "figma", "tools"]) {
  watchers.push(watch(path.join(root, directory), { recursive: true }, changed));
}
watchers.push(watch(root, (_, filename) => {
  if (filename && (filename.endsWith(".md") || filename === "package.json")) changed();
}));

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    if (url.pathname === "/__preview/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      response.write("retry: 1000\n: connected\n\n");
      clients.add(response);
      request.once("close", () => clients.delete(response));
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    if (dirty || building) await rebuild();
    const filename = path.resolve(output, `.${decodeURIComponent(url.pathname)}`);
    if (filename !== output && !filename.startsWith(`${output}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const file = (await stat(filename)).isDirectory() ? path.join(filename, "index.html") : filename;
    let body = await readFile(file);
    const extension = path.extname(file);
    if (extension === ".html") body = Buffer.from(body.toString().replace("</body>", `${reload}</body>`));
    response.writeHead(200, {
      "Content-Type": types[extension] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Length": body.length,
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8",
    }).end(error.code === "ENOENT" ? "Not found" : "Preview build failed; see terminal output.");
    if (error.code !== "ENOENT") console.error(error);
  }
});

function stop() {
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  for (const client of clients) client.end();
  server.close();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
server.on("error", (error) => { console.error(error); stop(); process.exitCode = 1; });

await rebuild();
server.listen(port, host, () => {
  console.log(`Stylos preview: http://${host}:${port}/`);
  console.log("Watching documentation, tokens, assets and renderers. Ctrl+C to stop.");
});
