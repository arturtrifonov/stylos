// A writer and reader for a deliberately restricted subset of YAML, as a
// matched pair. The writer emits only what the reader accepts; the reader
// throws on anything else. See docs/specs/0001-token-pipeline.md §7.
//
// The subset: block mappings and block sequences, 2-space indent; numbers,
// true/false and null unquoted; every other scalar double-quoted; keys
// unquoted only when they match ^[A-Za-z0-9_-]+$; optional leading # comment
// lines. No anchors, no aliases, no flow collections, no multi-line scalars.
//
// This is what keeps tools/ dependency-free without pretending to implement
// the YAML spec. If the subset stops being enough, that is the signal to take
// a dependency — deliberately, in a new decision record — not to stretch the
// parser.
//
// Mappings are Maps and sequences are Arrays, in both directions. Not plain
// objects: a plain object reorders keys that look like array indices ahead of
// insertion order, and palette step names ("25" … "975") are exactly that
// shape. Map has no such rule.

const BARE_KEY = /^[A-Za-z0-9_-]+$/;
const NUMBER = /^-?\d+(\.\d+)?$/;

function quote(text) {
  // Backslash first — escaping the quotes first would then double their escapes.
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatKey(key) {
  if (typeof key !== "string") {
    throw new Error(`yaml: mapping key must be a string, got ${typeof key}`);
  }
  return BARE_KEY.test(key) ? key : quote(key);
}

// Note the asymmetry with formatKey: a key is quoted only when it has to be,
// but a *value* string is always quoted, even one like "color" that would pass
// the bare-key test. Otherwise the reader could not tell it from a keyword.
function formatScalar(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`yaml: cannot serialize non-finite number ${value}`);
    }
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  throw new Error(`yaml: cannot serialize a value of type ${typeof value}`);
}

function isCollection(value) {
  return value instanceof Map || Array.isArray(value);
}

function assertNotEmpty(value, context) {
  if (value instanceof Map && value.size === 0) {
    throw new Error(
      `yaml: cannot serialize an empty mapping for ${context} — the restricted subset has no flow-collection syntax, so omit the key instead`
    );
  }
  if (Array.isArray(value) && value.length === 0) {
    throw new Error(
      `yaml: cannot serialize an empty sequence for ${context} — the restricted subset has no flow-collection syntax, so omit the key instead`
    );
  }
}

function emit(node, indent, lines) {
  const pad = "  ".repeat(indent);

  if (node instanceof Map) {
    for (const [key, value] of node) {
      if (isCollection(value)) {
        assertNotEmpty(value, `key "${key}"`);
        lines.push(`${pad}${formatKey(key)}:`);
        emit(value, indent + 1, lines);
      } else {
        lines.push(`${pad}${formatKey(key)}: ${formatScalar(value)}`);
      }
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const value of node) {
      if (isCollection(value)) {
        assertNotEmpty(value, "a sequence item");
        // The dash sits alone and the nested block indents past it, so a
        // sequence of mappings reads: key: / "  -" / "    field: …".
        lines.push(`${pad}-`);
        emit(value, indent + 1, lines);
      } else {
        lines.push(`${pad}- ${formatScalar(value)}`);
      }
    }
    return;
  }

  throw new Error(`yaml: expected a Map or an Array, got ${typeof node}`);
}

/**
 * Serialize a Map/Array/scalar tree into the restricted subset.
 * `comments` are emitted as `# ...` lines above the document.
 */
export function stringify(root, { comments = [] } = {}) {
  const lines = comments.map((line) => `# ${line}`);

  if (isCollection(root)) {
    assertNotEmpty(root, "the document root");
    emit(root, 0, lines);
  } else {
    lines.push(formatScalar(root));
  }

  return lines.map((line) => line.replace(/\s+$/, "")).join("\n") + "\n";
}

function unquote(text, filename, lineNo) {
  let out = "";
  for (let i = 1; i < text.length - 1; i++) {
    const c = text[i];
    if (c !== "\\") {
      if (c === '"') {
        throw new Error(`${filename}:${lineNo}: unescaped quote inside a quoted scalar`);
      }
      out += c;
      continue;
    }
    const next = text[i + 1];
    if (next === '"' || next === "\\") {
      out += next;
      i++;
    } else {
      throw new Error(
        `${filename}:${lineNo}: unknown escape "\\${next ?? ""}" — only \\" and \\\\ are supported`
      );
    }
  }
  return out;
}

function parseScalar(text, filename, lineNo) {
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;
  if (NUMBER.test(text)) return Number(text);
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return unquote(text, filename, lineNo);
  }
  throw new Error(
    `${filename}:${lineNo}: unquoted scalar ${JSON.stringify(text)} — quote it, or did you mean a number?`
  );
}

// Split a "key: value" or "key:" line into its key and the rest. Bare keys
// cannot contain a colon (the charset forbids it), and a quoted key ends at
// its closing quote, so this never has to guess where the key stops.
function splitKey(content, filename, lineNo) {
  if (content.startsWith('"')) {
    let end = -1;
    for (let i = 1; i < content.length; i++) {
      if (content[i] === "\\") {
        i++;
        continue;
      }
      if (content[i] === '"') {
        end = i;
        break;
      }
    }
    if (end === -1) throw new Error(`${filename}:${lineNo}: unterminated quoted key`);
    if (content[end + 1] !== ":") {
      throw new Error(`${filename}:${lineNo}: expected ":" after a quoted key`);
    }
    return {
      key: unquote(content.slice(0, end + 1), filename, lineNo),
      rest: content.slice(end + 2).trim(),
    };
  }

  const colon = content.indexOf(":");
  if (colon === -1) {
    throw new Error(
      `${filename}:${lineNo}: expected "key: value" or "- item", got ${JSON.stringify(content)}`
    );
  }
  const key = content.slice(0, colon);
  if (!BARE_KEY.test(key)) {
    throw new Error(
      `${filename}:${lineNo}: unquoted key ${JSON.stringify(key)} — keys outside [A-Za-z0-9_-] must be quoted`
    );
  }
  return { key, rest: content.slice(colon + 1).trim() };
}

/**
 * Parse the restricted subset. Throws, with a `filename:line` prefix, on
 * anything the writer would not have produced.
 */
export function parse(text, { filename = "<yaml>" } = {}) {
  const rows = [];
  const rawLines = text.split("\n");

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].replace(/\r$/, "");
    const lineNo = i + 1;
    if (line.trim() === "") continue;

    const leading = line.slice(0, line.length - line.trimStart().length);
    if (leading.includes("\t")) {
      throw new Error(`${filename}:${lineNo}: tab character in indentation — use spaces`);
    }
    // The writer only ever emits comments at column 0, but the two authored
    // files are more readable with them indented alongside what they explain.
    // A whole line starting with # can never be a valid key or sequence item
    // (bare keys exclude #, quoted keys start with "), so this is unambiguous.
    if (line.trimStart().startsWith("#")) continue;

    if (leading.length % 2 !== 0) {
      throw new Error(
        `${filename}:${lineNo}: odd indentation (${leading.length} spaces) — the subset uses 2 spaces per level`
      );
    }
    rows.push({ indent: leading.length / 2, content: line.trim(), lineNo });
  }

  if (rows.length === 0) {
    throw new Error(`${filename}: no content`);
  }
  if (rows[0].indent !== 0) {
    throw new Error(`${filename}:${rows[0].lineNo}: document must start at indent 0`);
  }

  let cursor = 0;

  // Parse every consecutive row sitting at exactly `indent`, plus their
  // nested blocks. Returns a Map or an Array depending on what the first row
  // at this level turned out to be.
  function parseBlock(indent) {
    const first = rows[cursor];
    const isSequence = first.content === "-" || first.content.startsWith("- ");
    const node = isSequence ? [] : new Map();

    while (cursor < rows.length && rows[cursor].indent >= indent) {
      const row = rows[cursor];

      if (row.indent > indent) {
        throw new Error(
          `${filename}:${row.lineNo}: unexpected indentation — expected ${indent * 2} spaces`
        );
      }

      const rowIsSequence = row.content === "-" || row.content.startsWith("- ");
      if (rowIsSequence !== isSequence) {
        throw new Error(
          `${filename}:${row.lineNo}: mapping and sequence mixed at the same indentation level`
        );
      }

      let inline;
      let assign;

      if (isSequence) {
        inline = row.content === "-" ? "" : row.content.slice(2).trim();
        assign = (value) => node.push(value);
      } else {
        const { key, rest } = splitKey(row.content, filename, row.lineNo);
        if (node.has(key)) {
          throw new Error(`${filename}:${row.lineNo}: duplicate key ${JSON.stringify(key)}`);
        }
        inline = rest;
        assign = (value) => node.set(key, value);
      }

      cursor++;

      if (inline !== "") {
        assign(parseScalar(inline, filename, row.lineNo));
        continue;
      }

      // Nothing after the colon (or the dash): the value is a nested block.
      const next = rows[cursor];
      if (!next || next.indent <= indent) {
        throw new Error(
          `${filename}:${row.lineNo}: expected an indented block below this line`
        );
      }
      if (next.indent !== indent + 1) {
        throw new Error(
          `${filename}:${next.lineNo}: unexpected indentation — expected ${(indent + 1) * 2} spaces`
        );
      }
      assign(parseBlock(indent + 1));
    }

    return node;
  }

  const root = parseBlock(0);
  if (cursor < rows.length) {
    throw new Error(`${filename}:${rows[cursor].lineNo}: unexpected content after the document`);
  }
  return root;
}

/** Order-sensitive deep equality over Maps, Arrays and scalars. */
export function deepEqualOrdered(a, b) {
  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    const left = [...a];
    const right = [...b];
    return left.every(
      ([key, value], i) => right[i][0] === key && deepEqualOrdered(value, right[i][1])
    );
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, i) => deepEqualOrdered(value, b[i]));
  }
  return a === b;
}
