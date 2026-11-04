import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { createAuth, createOidc } from './auth.mjs';
import { createStore } from './store.mjs';
import { createApp } from './app.mjs';

const required = name => { const value = process.env[name]; if (!value) throw new Error('Missing ' + name); return value; };
const origin = required('COLORS_ORIGIN');
const provider = createOidc({ origin, issuer: required('OIDC_ISSUER'), clientId: required('OIDC_CLIENT_ID'), clientSecret: required('OIDC_CLIENT_SECRET') });
const auth = createAuth({ origin, allowedSubjects: required('COLORS_EDITOR_SUBJECTS').split(',').map(s => s.trim()).filter(Boolean), provider });
const snapshot = JSON.parse(readFileSync(process.env.COLORS_SNAPSHOT ?? '/app/stylos.json', 'utf8'));
const app = createApp({ auth, store: createStore(process.env.COLORS_DATA ?? '/data', snapshot) });
const server = createServer(async (incoming, outgoing) => {
  try {
    if (!incoming.url?.startsWith('/') || incoming.url.startsWith('//')) { outgoing.statusCode = 400; outgoing.end('Invalid request target.'); return; }
    const method = incoming.method ?? 'GET';
    const url = new URL(incoming.url, origin);
    if (url.origin !== origin) { outgoing.statusCode = 400; outgoing.end('Invalid request origin.'); return; }
    const request = new Request(url, { method, headers: incoming.headers,
      ...(['GET', 'HEAD'].includes(method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }) });
    const response = await app(request);
    outgoing.statusCode = response.status;
    for (const [name, value] of response.headers) if (name !== 'set-cookie') outgoing.setHeader(name, value);
    const cookies = response.headers.getSetCookie(); if (cookies.length) outgoing.setHeader('Set-Cookie', cookies);
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.statusCode = 500; outgoing.end('Request failed.'); }
});
server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxHeadersCount = 50;
server.listen(3000, '0.0.0.0', () => console.log('Colors API listening on port 3000.'));
