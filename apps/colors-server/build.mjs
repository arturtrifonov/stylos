import { build } from 'rolldown';
await build({ input: new URL('./index.mjs', import.meta.url).pathname, platform: 'node', external: /^node:/,
  output: { file: new URL('./dist/server.mjs', import.meta.url).pathname, format: 'esm' } });
