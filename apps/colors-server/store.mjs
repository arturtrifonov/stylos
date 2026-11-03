import { mkdirSync, readFileSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { importAssignments, importChanges, exportChanges, createDraft } from '../colors/src/model.mjs';
import { validateProjections } from '../colors/src/projection.mjs';
import { createFigmaBundle } from '../colors/src/figma-bundle.mjs';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// One server process owns the volume. Synchronous compare/write keeps revisions
// atomic across concurrent requests; rename publishes each durable JSON record.
export function createStore(directory, snapshot) {
  mkdirSync(path.join(directory, 'history'), { recursive: true, mode: 0o700 });
  const read = name => {
    try { return JSON.parse(readFileSync(path.join(directory, name + '.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  function write(name, value) {
    const temporary = path.join(directory, '.' + randomUUID() + '.tmp');
    try {
      writeFileSync(temporary, JSON.stringify(value) + '\n', { mode: 0o600, flag: 'wx' });
      const file = openSync(temporary, 'r'); try { fsyncSync(file); } finally { closeSync(file); }
      renameSync(temporary, path.join(directory, name + '.json'));
      const folder = openSync(path.dirname(path.join(directory, name + '.json')), 'r'); try { fsyncSync(folder); } finally { closeSync(folder); }
    } finally { rmSync(temporary, { force: true }); }
  }
  function normalize(draft) {
    if (!draft || !Array.isArray(draft.changes) || draft.changes.length > 10000 || Object.keys(draft.coordinates ?? {}).length > 10000 ||
        (draft.roles ?? []).length > 10000 || (draft.scale ?? []).length > 10000) throw new HttpError(400, 'Invalid or oversized color draft.');
    try {
      const palette = importChanges(snapshot, draft);
      if (Object.keys(palette).length > 5000) throw new Error('The palette is too large.');
      validateProjections(palette, draft.coordinates ?? {});
      return exportChanges(snapshot, palette, draft.coordinates ?? {}, importAssignments(snapshot, draft, palette));
    } catch (error) { throw new HttpError(400, error.message); }
  }
  function working() {
    return read('working') ?? { schemaVersion: 1, revision: '0', updatedAt: null, draft: exportChanges(snapshot, createDraft(snapshot)) };
  }
  function compare(record, expected) {
    if (!expected) throw new HttpError(428, 'Open the saved working copy before saving.');
    if (record.revision !== expected) throw new HttpError(409, 'The working copy changed in another tab. Open it again before saving.');
  }
  return {
    working,
    save(draft, expected, subject) {
      const previous = working(); compare(previous, expected);
      const next = { schemaVersion: 1, revision: randomUUID(), updatedAt: new Date().toISOString(), subject, draft: normalize(draft) };
      write('history/' + next.revision, next); write('working', next);
      return next;
    },
    publish(expected, subject) {
      const saved = working(); compare(saved, expected);
      const draft = normalize(saved.draft);
      const palette = importChanges(snapshot, draft);
      const next = { schemaVersion: 1, revision: randomUUID(), workingRevision: saved.revision, updatedAt: new Date().toISOString(), subject, draft,
        bundle: createFigmaBundle(snapshot, palette, draft.coordinates ?? {}, importAssignments(snapshot, draft, palette)) };
      write('history/' + next.revision, next); write('published', next);
      return { revision: next.revision, workingRevision: next.workingRevision, updatedAt: next.updatedAt };
    },
    published() {
      const record = read('published');
      // A new canonical import must not silently serve a draft based on old tokens.
      if (record && record.bundle?.source?.fingerprint !== snapshot.fingerprint) throw new HttpError(409, 'Published colors need review against the new canonical source.');
      return record?.bundle ?? createFigmaBundle(snapshot, createDraft(snapshot));
    },
  };
}
