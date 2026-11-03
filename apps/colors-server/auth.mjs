import { randomBytes, timingSafeEqual } from 'node:crypto';
import * as oidc from 'openid-client';
import { HttpError } from './store.mjs';

const SESSION = '__Host-colors-session', TRANSACTION = '__Host-colors-login';
const token = () => randomBytes(32).toString('base64url');
const cookie = (name, value, age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
function getCookie(request, name) {
  const value = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createOidc({ issuer, clientId, clientSecret, origin, customFetch }) {
  if (new URL(issuer).protocol !== 'https:') throw new Error('Pocket ID must use HTTPS.');
  let configuration;
  async function config() {
    configuration ??= oidc.discovery(new URL(issuer), clientId, clientSecret, undefined, { timeout: 8, ...(customFetch ? { [oidc.customFetch]: customFetch } : {}) })
      .then(value => { value.timeout = 8; oidc.enableNonRepudiationChecks(value); return value; })
      .catch(error => { configuration = null; throw error; });
    return configuration;
  }
  return {
    async start() {
      const verifier = oidc.randomPKCECodeVerifier(), state = oidc.randomState(), nonce = oidc.randomNonce();
      const url = oidc.buildAuthorizationUrl(await config(), { redirect_uri: origin + '/auth/callback', scope: 'openid profile',
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256', state, nonce });
      return { verifier, state, nonce, url: url.href };
    },
    async finish(url, transaction) {
      const result = await oidc.authorizationCodeGrant(await config(), url, { pkceCodeVerifier: transaction.verifier,
        expectedState: transaction.state, expectedNonce: transaction.nonce, idTokenExpected: true });
      const claims = result.claims();
      if (!claims?.sub) throw new Error('Missing subject.');
      return { subject: claims.sub, name: typeof claims.name === 'string' ? claims.name.slice(0, 100) : 'Stylos editor' };
    },
  };
}

export function createAuth({ origin, allowedSubjects, provider, now = Date.now }) {
  const sessions = new Map(), transactions = new Map();
  const allowed = new Set(allowedSubjects);
  if (new URL(origin).origin !== origin || !origin.startsWith('https://') || !allowed.size) throw new Error('Configure an HTTPS origin and an explicit editor subject allowlist.');
  const prune = map => { for (const [id, record] of map) if (record.expires <= now()) map.delete(id); };
  const session = request => { prune(sessions); const result = sessions.get(getCookie(request, SESSION)); return result && allowed.has(result.user.subject) ? result : null; };
  function editor(request) { const current = session(request); if (!current) throw new HttpError(401, 'Sign in to save the Stylos working copy.'); return current; }
  function write(request) {
    const current = editor(request);
    if (request.headers.get('origin') !== origin || !equal(current.csrf, request.headers.get('x-csrf-token'))) throw new HttpError(403, 'This request did not come from your Colors session. Reload and try again.');
    return current;
  }
  return {
    session, editor, write,
    async login(request) {
      prune(transactions);
      if (transactions.size >= 100) throw new HttpError(429, 'Too many pending sign-ins. Try again shortly.');
      const previous = getCookie(request, TRANSACTION); if (previous) transactions.delete(previous);
      let transaction;
      try { transaction = await provider.start(); } catch { throw new HttpError(502, 'Pocket ID is unavailable. Try signing in again shortly.'); }
      if (transactions.size >= 100) throw new HttpError(429, 'Too many pending sign-ins. Try again shortly.');
      const id = token(); transactions.set(id, { ...transaction, expires: now() + 600000 });
      return { location: transaction.url, cookies: [cookie(TRANSACTION, id, 600)] };
    },
    async callback(request) {
      prune(transactions);
      const id = getCookie(request, TRANSACTION), transaction = transactions.get(id); transactions.delete(id);
      const url = new URL(request.url);
      if (!transaction || !equal(url.searchParams.get('state'), transaction.state)) throw new HttpError(400, 'The sign-in expired or could not be verified. Start again.');
      let user;
      try { user = await provider.finish(url, transaction); } catch { throw new HttpError(400, 'Pocket ID could not verify this sign-in. Start again.'); }
      if (!allowed.has(user.subject)) throw new HttpError(403, 'This Pocket ID account cannot save Stylos.');
      prune(sessions);
      if (sessions.size >= 1000) throw new HttpError(429, 'Too many active sessions. Try again later.');
      const previous = getCookie(request, SESSION); if (previous) sessions.delete(previous);
      const sessionId = token(); sessions.set(sessionId, { user, csrf: token(), expires: now() + 8 * 3600000 });
      return { location: '/', cookies: [cookie(TRANSACTION, '', 0), cookie(SESSION, sessionId, 8 * 3600)] };
    },
    logout(request) { write(request); sessions.delete(getCookie(request, SESSION)); return cookie(SESSION, '', 0); },
  };
}
