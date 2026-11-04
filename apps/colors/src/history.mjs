// Whole editor commands are reversible, including coordinates and structure.
/** @typedef {{palette: import('./model.mjs').Palette, coordinates: import('./model.mjs').Coordinates, assignments: import('./model.mjs').Assignments}} EditorState */
/** @typedef {{past:EditorState[], present:EditorState, future:EditorState[], group:string|null}} History */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const LIMIT = 60

/** @param {EditorState} present @param {EditorState} baseline @returns {History} */
export function createHistory(present, baseline = present) {
  return { past: same(present, baseline) ? [] : [baseline], present, future: [], group: null }
}

/** @param {History} history @param {EditorState} next @param {string|null} group @returns {History} */
export function recordHistory(history, next, group = null) {
  if (same(history.present, next)) return history
  const past = group && group === history.group ? history.past : [...history.past, history.present].slice(-LIMIT)
  return { past, present: next, future: [], group }
}

/** @param {History} history @returns {History} */
export function undoHistory(history) {
  if (!history.past.length) return history
  return { past: history.past.slice(0, -1), present: history.past.at(-1), future: [history.present, ...history.future], group: null }
}

/** @param {History} history @returns {History} */
export function redoHistory(history) {
  if (!history.future.length) return history
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1), group: null }
}
