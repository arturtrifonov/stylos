import { HttpError } from './store.mjs';

const publicWorking = record => ({ revision: record.revision, updatedAt: record.updatedAt, draft: record.draft });
function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });
}
async function readJson(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) throw new HttpError(415, 'Send a JSON draft.');
  const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, 'Missing draft.');
  const chunks = []; let length = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength;
    if (length > 1_048_576) { await reader.cancel(); throw new HttpError(413, 'The draft is larger than 1 MB.'); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON draft.'); }
}
export function createApp({ store, auth }) {
  return async request => {
    const pathname = new URL(request.url).pathname;
    try {
      if (pathname === '/health' && request.method === 'GET') return json({ ok: true });
      if (pathname === '/stylos-colors.figma.json' && request.method === 'GET') return json(store.published(), 200, { 'Access-Control-Allow-Origin': '*' });
      if (pathname === '/api/session' && request.method === 'GET') {
        const session = auth.session(request);
        return json(session ? { user: { name: session.user.name }, csrf: session.csrf } : { user: null });
      }
      if (pathname === '/auth/login' && request.method === 'GET' || pathname === '/auth/callback' && request.method === 'GET') {
        const result = pathname === '/auth/login' ? await auth.login(request) : await auth.callback(request);
        const headers = new Headers({ Location: result.location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
        for (const cookie of result.cookies) headers.append('Set-Cookie', cookie);
        return new Response(null, { status: 303, headers });
      }
      if (pathname === '/auth/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': auth.logout(request) });
      if (pathname === '/api/stylos' && request.method === 'GET') { auth.editor(request); return json(publicWorking(store.working())); }
      if (pathname === '/api/stylos' && request.method === 'PUT') {
        const session = auth.write(request);
        const draft = await readJson(request);
        return json(publicWorking(store.save(draft, request.headers.get('if-match'), session.user.subject)));
      }
      if (pathname === '/api/stylos/publish' && request.method === 'POST') {
        const session = auth.write(request);
        return json(store.publish(request.headers.get('if-match'), session.user.subject));
      }
      return json({ message: 'Not found.' }, 404);
    } catch (error) {
      if (error instanceof HttpError) return json({ message: error.message }, error.status, pathname === '/stylos-colors.figma.json' ? { 'Access-Control-Allow-Origin': '*' } : {});
      // Never log OAuth query strings, tokens, cookies or draft contents.
      console.error('Colors server request failed.');
      return json({ message: 'The server could not complete this request.' }, 500);
    }
  };
}
