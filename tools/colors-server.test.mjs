import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { createApp } from '../apps/colors-server/app.mjs';
import { createAuth, createOidc } from '../apps/colors-server/auth.mjs';
import { createStore } from '../apps/colors-server/store.mjs';
import { buildColorsSnapshot } from './build-colors-data.mjs';
import { createDraft, exportChanges } from '../apps/colors/src/model.mjs';
const snapshot = buildColorsSnapshot(new URL('../', import.meta.url).pathname);
const origin = 'https://colors.example.test', issuer = 'https://id.example.test';
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...keys.publicKey.export({ format: 'jwk' }), kid: 'test', alg: 'RS256', use: 'sig' };
function jwt(claims, validSignature = true) {
  const input = [ { alg: 'RS256', kid: 'test' }, claims ].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  const signature = sign('RSA-SHA256', Buffer.from(input), keys.privateKey);
  if (!validSignature) signature[0] ^= 1;
  return input + '.' + signature.toString('base64url');
}
function fixture(options = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'stylos-server-'));
  const clock = { now: Date.now() }; const grants = new Map();
  const provider = createOidc({ issuer, origin, clientId: 'colors', clientSecret: 'test-only-secret', customFetch: async (url, init) => {
    const u = new URL(url);
    if (u.pathname === '/.well-known/openid-configuration') return Response.json({ issuer, authorization_endpoint: issuer + '/authorize', token_endpoint: issuer + '/token', jwks_uri: issuer + '/jwks',
      response_types_supported: ['code'], subject_types_supported: ['public'], id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_post'], code_challenge_methods_supported: ['S256'] });
    if (u.pathname === '/jwks') return Response.json({ keys: [jwk] });
    if (u.pathname === '/token') {
      const parameters = new URLSearchParams(init.body); const grant = grants.get(parameters.get('code')); grants.delete(parameters.get('code'));
      assert(grant, 'the grant exists and is single-use');
      assert.equal(parameters.get('client_secret'), 'test-only-secret');
      assert.equal(createHash('sha256').update(parameters.get('code_verifier')).digest('base64url'), grant.challenge);
      const now = Math.floor(Date.now() / 1000);
      return Response.json({ access_token: 'unused-test-access-token', token_type: 'Bearer', expires_in: 600,
        id_token: jwt({ iss: issuer, aud: options.badAudience ? 'someone-else' : 'colors', sub: options.subject ?? 'owner', name: 'Owner', iat: now, exp: now + 600, nonce: options.badNonce ? 'wrong' : grant.nonce }, !options.badSignature) });
    }
    throw new Error('Unexpected identity request');
  } });
  const auth = createAuth({ origin, allowedSubjects: ['owner'], provider, now: () => clock.now });
  const store = createStore(directory, snapshot), app = createApp({ store, auth });
  const request = (route, init = {}) => app(new Request(origin + route, init));
  async function login() {
    const start = await request('/auth/login'); assert.equal(start.status, 303);
    const url = new URL(start.headers.get('location'));
    assert.equal(url.origin, issuer); assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    const state = url.searchParams.get('state'); const callback = '/auth/callback?code=test-code&state=' + state;
    grants.set('test-code', { nonce: url.searchParams.get('nonce'), challenge: url.searchParams.get('code_challenge') });
    const loginCookie = start.headers.getSetCookie()[0].split(';')[0];
    const response = await request(options.badState ? callback + 'wrong' : callback, { headers: { Cookie: loginCookie } });
    return { response, loginCookie, callback, cookie: response.headers.getSetCookie().find(value => value.startsWith('__Host-colors-session='))?.split(';')[0] };
  }
  const draft = createDraft(snapshot); draft['indigo/700'].light = '#123456';
  return { app, request, login, auth, store, clock, directory, patch: exportChanges(snapshot, draft), close() { rmSync(directory, { recursive: true, force: true }); } };
}

test('public token reads work, while guests and forged cookies cannot read or save the working instance', async () => {
  const f = fixture(); try {
    const bundle = await f.request('/stylos-colors.figma.json'); assert.equal(bundle.status, 200); assert.equal(bundle.headers.get('access-control-allow-origin'), '*');
    assert.deepEqual((await bundle.json()).palette, snapshot.palette);
    assert.deepEqual(await (await f.request('/api/session')).json(), { user: null });
    for (const [route, method] of [['/api/stylos','GET'],['/api/stylos','PUT'],['/api/stylos/publish','POST']]) {
      const result = await f.request(route, { method, headers: { Cookie: '__Host-colors-session=' + 'x'.repeat(43) } }); assert.equal(result.status, 401);
    }
    assert.equal(f.store.working().revision, '0');
  } finally { f.close(); }
});

test('real OIDC code + PKCE validates signed tokens, limits access to the owner and rejects replay', async () => {
  for (const options of [{}, { subject: 'other' }, { badState: true }, { badNonce: true }, { badSignature: true }, { badAudience: true }]) {
    const f = fixture(options); try {
      const login = await f.login(); assert.equal(login.response.status, options.subject ? 403 : Object.keys(options).length ? 400 : 303);
      if (login.cookie) {
        const session = await f.request('/api/session', { headers: { Cookie: login.cookie } });
        const data = await session.json(); assert.equal(data.user.name, 'Owner'); assert(data.csrf);
        assert.equal(session.headers.get('access-control-allow-origin'), null);
        assert(login.response.headers.getSetCookie().some(value => /HttpOnly; Secure; SameSite=Lax/.test(value)));
      }
      assert.equal((await f.request(login.callback, { headers: { Cookie: login.loginCookie } })).status, 400);
    } finally { f.close(); }
  }
});

test('a verified owner can save, reopen and publish; drafts persist across restarts and do not publish implicitly', async () => {
  const f = fixture(); try {
    const { cookie } = await f.login(); const session = await (await f.request('/api/session', { headers: { Cookie: cookie } })).json();
    const headers = { Cookie: cookie, Origin: origin, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json', 'If-Match': '0' };
    for (const modified of [{ Origin: 'https://other.example' }, { 'X-CSRF-Token': 'wrong' }, { Origin: '' }]) assert.equal((await f.request('/api/stylos', { method: 'PUT', headers: { ...headers, ...modified }, body: JSON.stringify(f.patch) })).status, 403);
    const response = await f.request('/api/stylos', { method: 'PUT', headers, body: JSON.stringify(f.patch) }); assert.equal(response.status, 200);
    const saved = await response.json(); assert.notEqual(saved.revision, '0');
    assert.equal((await f.request('/api/stylos', { headers: { Cookie: cookie } })).status, 200);
    assert.equal(createStore(f.directory, snapshot).working().revision, saved.revision);
    assert.deepEqual(f.store.published().palette, snapshot.palette);
    assert(readdirSync(path.join(f.directory, 'history')).length > 0);
    const publish = await f.request('/api/stylos/publish', { method: 'POST', headers: { ...headers, 'If-Match': saved.revision } }); assert.equal(publish.status, 200);
    const published = await (await f.request('/stylos-colors.figma.json')).json();
    assert.equal(published.palette['indigo/700'].light, '#123456'); assert.equal(published.basePalette['indigo/700'].light, snapshot.palette['indigo/700'].light);
    assert.equal((await f.request('/auth/logout', { method: 'POST', headers })).status, 200);
    assert.equal((await f.request('/api/stylos', { headers: { Cookie: cookie } })).status, 401);
  } finally { f.close(); }
});

test('concurrent saves, stale sources, invalid coordinates and oversized bodies cannot overwrite newer work', async () => {
  const f = fixture(); try {
    const { cookie } = await f.login(); const session = await (await f.request('/api/session', { headers: { Cookie: cookie } })).json();
    const headers = { Cookie: cookie, Origin: origin, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json', 'If-Match': '0' };
    for (const invalid of [{ ...f.patch, base: 'stale' }, { ...f.patch, coordinates: { 'light:indigo/700': { space: 'oklch', lch: [0, 0, 0] } } }]) assert.equal((await f.request('/api/stylos', { method: 'PUT', headers, body: JSON.stringify(invalid) })).status, 400);
    assert.equal((await f.request('/api/stylos', { method: 'PUT', headers, body: 'x'.repeat(1_048_577) })).status, 413);
    const results = await Promise.all([1,2].map(() => f.request('/api/stylos', { method: 'PUT', headers, body: JSON.stringify(f.patch) })));
    assert.deepEqual(results.map(r => r.status).sort(), [200,409]);
    const revision = f.store.working().revision;
    assert.equal((await f.request('/api/stylos/publish', { method: 'POST', headers })).status, 409);
    assert.equal(f.store.working().revision, revision);
    f.clock.now += 8 * 3600000;
    assert.equal((await f.request('/api/stylos', { headers: { Cookie: cookie } })).status, 401);
  } finally { f.close(); }
});
