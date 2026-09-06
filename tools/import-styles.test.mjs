import test from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadCanonical } from "./lib/tokens.mjs";
import { buildStylesDocument, importStyles, OUT_FILE } from "./import-styles.mjs";
import { renderTextCss } from "./build-text-css.mjs";
import { parse } from "./lib/yaml.mjs";

/** A scratch root with a minimal font collection to resolve against. */
function scratchRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "stylos-styles-"));
  mkdirSync(path.join(root, "tokens"), { recursive: true });
  mkdirSync(path.join(root, "figma"), { recursive: true });
  writeFileSync(
    path.join(root, "tokens", "font.yaml"),
    [
      'collection: "font"',
      'layer: "primitive"',
      "modes:",
      '  - "default"',
      "tokens:",
      '  "family/normal":',
      '    type: "string"',
      "    values:",
      '      default: "Georama"',
      '  "weight/normal":',
      '    type: "number"',
      "    values:",
      "      default: 400",
      '  "size/1_000":',
      '    type: "number"',
      "    values:",
      "      default: 16",
      '  "line height/text/1_000":',
      '    type: "number"',
      "    values:",
      "      default: 24",
      '  "letter spacing/style/normal":',
      '    type: "number"',
      "    values:",
      "      default: 0",
      '  "paragraph spacing/1_125":',
      '    type: "number"',
      "    values:",
      "      default: 9",
      "",
    ].join("\n")
  );
  return root;
}

const STYLE = {
  name: "text/normal/medium",
  bound: {
    fontFamily: "family/normal",
    fontWeight: "weight/normal",
    fontSize: "size/1_000",
    lineHeight: "line height/text/1_000",
    letterSpacing: "letter spacing/style/normal",
    paragraphSpacing: "paragraph spacing/1_125",
  },
  textCase: "ORIGINAL",
  width: 100,
  raw: { fontSize: 16, lineHeight: 24, letterSpacing: 0, paragraphSpacing: 9 },
};

function dump(styles) {
  return {
    read: "2026-09-06 15:30Z",
    figma_file: "Stylos / Styles",
    figma_key: "k".repeat(22),
    text_styles: styles,
    avatar_styles: ["avatars/01"],
  };
}

test("buildStylesDocument records aliases, never raw values", () => {
  const collections = loadCanonical(scratchRoot());
  const { document, report } = buildStylesDocument(dump([STYLE]), collections);

  assert.deepEqual(report, []);
  const entry = document.styles["text/normal/medium"];
  assert.equal(entry["font size"], "font/size/1_000");
  assert.equal(entry["line height"], "font/line height/text/1_000");
  assert.equal(entry["text case"], "original");
  // Width 100 is the default and is omitted; raw pixel values appear nowhere.
  assert.ok(!("width" in entry));
  assert.ok(!JSON.stringify(document).includes('"16"'));
});

test("an unresolved binding is recorded and reported, not dropped or invented", () => {
  const collections = loadCanonical(scratchRoot());
  const broken = {
    ...STYLE,
    name: "label/normal/extra large",
    bound: { ...STYLE.bound, fontFamily: "family/string" },
  };
  const { document, report } = buildStylesDocument(dump([broken]), collections);

  const entry = document.styles["label/normal/extra large"];
  assert.deepEqual(entry.unresolved, ["font family: font/family/string"]);
  assert.ok(!("font family" in entry));
  assert.equal(report.length, 1);
  assert.match(report[0], /family\/string/);
});

test("a style whose alias resolves to a different value than it renders is reported", () => {
  const collections = loadCanonical(scratchRoot());
  const drifted = { ...STYLE, raw: { ...STYLE.raw, fontSize: 17 } };
  const { report } = buildStylesDocument(dump([drifted]), collections);
  assert.equal(report.length, 1);
  assert.match(report[0], /resolves font\/size\/1_000 to 16, but the style renders 17/);
});

test("importStyles writes the record and renderTextCss projects it, skipping unresolved", () => {
  const root = scratchRoot();
  const broken = {
    ...STYLE,
    name: "label/broken",
    bound: { ...STYLE.bound, fontFamily: "family/missing" },
  };
  const dumpPath = path.join(root, "dump.json");
  writeFileSync(dumpPath, JSON.stringify(dump([STYLE, broken])));

  const { count, report } = importStyles(root, dumpPath);
  assert.equal(count, 2);
  assert.equal(report.length, 1);

  const record = parse(readFileSync(path.join(root, OUT_FILE), "utf8"), { filename: OUT_FILE });
  const { css, count: projected, skipped } = renderTextCss(record);
  assert.equal(projected, 1);
  assert.deepEqual(skipped, ["label/broken"]);
  assert.ok(css.includes(".stylos-text-normal-medium {"));
  assert.ok(css.includes("font-size: var(--stylos-font-size-1_000);"));
  assert.ok(css.includes("--stylos-paragraph-spacing: var(--stylos-font-paragraph-spacing-1_125);"));
  assert.ok(!css.includes("label-broken {"));
  assert.match(css, /NOT projected .*label\/broken/);
});

test("uppercase and width off 100 project as text-transform and font-stretch", () => {
  const root = scratchRoot();
  const heading = { ...STYLE, name: "heading/h1", textCase: "UPPER", width: 110 };
  const dumpPath = path.join(root, "dump.json");
  writeFileSync(dumpPath, JSON.stringify(dump([heading])));
  importStyles(root, dumpPath);

  const record = parse(readFileSync(path.join(root, OUT_FILE), "utf8"), { filename: OUT_FILE });
  const { css } = renderTextCss(record);
  assert.ok(css.includes("text-transform: uppercase;"));
  assert.ok(css.includes("font-stretch: 110%;"));
});
