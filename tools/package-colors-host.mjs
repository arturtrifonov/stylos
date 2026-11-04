#!/usr/bin/env node
// Package a prebuilt editor only: no repository, credentials or node_modules.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(root, 'apps/colors/dist');
if (!existsSync(path.join(source, 'stylos-colors.figma.json'))) {
  throw new Error('Run npm run colors:build before packaging the host.');
}
const server = path.join(root, 'apps/colors-server/dist/server.mjs');
if (!existsSync(server)) throw new Error('Run npm run colors:server:build before packaging the host.');
const destination = path.join(root, 'build/colors-host');
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(path.join(root, 'deploy/colors'), destination, { recursive: true,
  filter: source => !path.basename(source).startsWith('.env') && !['data', 'backups'].includes(path.basename(source)),
});
cpSync(source, path.join(destination, 'site'), { recursive: true });
mkdirSync(path.join(destination, 'server'));
cpSync(server, path.join(destination, 'server/server.mjs'));
console.log('Colors host package: build/colors-host/');
