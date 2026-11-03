#!/usr/bin/env node
// Browser harness for the actual plugin panel and entrypoint. Its Figma API is
// simulated in memory; this server never reads or writes a real Figma file.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createFigmaTestApi } from './tests/figma-tokens-api.mjs';
import { buildColorsSnapshot } from './build-colors-data.mjs';
import { createFigmaBundle } from '../apps/colors/src/figma-bundle.mjs';
const root = new URL('../', import.meta.url).pathname;
const host = createFigmaTestApi(); let replies = [];
host.figma.ui = { postMessage(message) { replies.push(message); }, resize(width,height) { replies.push({type:'harness-resize',width,height}); } };
host.figma.root = { setRelaunchData() { throw new Error('Relaunch metadata unsupported by embedded host'); } };
host.figma.showUI = () => {};
const source = readFileSync(new URL('../apps/figma-tokens/code.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
vm.runInNewContext(compiled, { figma: host.figma, __html__: '' });
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html><head><title>Stylos Tokens — panel test</title><style>body{margin:0;background:#eceef1;font:12px system-ui;padding:24px}header{max-width:560px;margin:0 auto 12px;color:#686b70}.window{width:min(560px,100%);height:min(463px,calc(100dvh - 100px));margin:auto;border:1px solid #ddd;border-radius:12px;background:white;overflow:hidden;box-shadow:0 8px 28px #0001}.title{padding:12px 20px;border-bottom:1px solid #e5e5e8;font-weight:600}iframe{border:0;width:100%;height:calc(100% - 43px);display:block}</style></head><body><header>Panel test · simulated Figma API · no document changes<br><a href="/fixture.json" download="stylos-colors.figma.json">Download source fixture</a></header><div class="window"><div class="title">Stylos Tokens</div><iframe title="Stylos Tokens panel" src="/panel"></iframe></div><script>window.addEventListener('message',async(event)=>{if(event.source!==document.querySelector('iframe').contentWindow||!event.data?.pluginMessage)return;const response=await fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event.data.pluginMessage)});const replies=await response.json();for(const pluginMessage of replies){if(pluginMessage.type==='harness-resize'){document.querySelector('.window').style.height='min('+(pluginMessage.height+43)+'px,calc(100dvh - 100px))'}else event.source.postMessage({pluginMessage},'*')}})</script></body></html>`);
  } else if (request.url === '/panel') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(readFileSync(new URL('../apps/figma-tokens/ui.html', import.meta.url)));
  } else if (request.url === '/fixture.json') {
    const snapshot = buildColorsSnapshot(root); response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(createFigmaBundle(snapshot,snapshot.palette)));
  } else if (request.url === '/rpc' && request.method === 'POST') {
    try {
      let input = ''; for await (const chunk of request) { input += chunk; if (input.length > 2_100_000) throw new Error('Request too large'); }
      // Requests are short and serialized by the panel. Resize/invalidate do not
      // emit responses, so capture only this call's correlated replies.
      const offset = replies.length; await host.figma.ui.onmessage(JSON.parse(input));
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(replies.slice(offset)));
    } catch (error) { response.statusCode=400; response.end(JSON.stringify([{type:'error',message:error.message}])); }
  } else { response.statusCode=404; response.end('Not found'); }
});
server.listen(4176,'127.0.0.1',()=>console.log('Plugin panel harness: http://127.0.0.1:4176/ (simulated Figma API)'));
