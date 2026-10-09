import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "./lib/yaml.mjs";
import { loadCanonical } from "./lib/tokens.mjs";
import { property } from "./build-css.mjs";
import { renderTextCss } from "./build-text-css.mjs";
import { renderProseCss } from "./build-prose-css.mjs";

const root = new URL("../", import.meta.url);
const record = () => parse(readFileSync(new URL("figma/text-styles.yaml", root), "utf8"));

test("a recorded style update reaches individual text and automatic document typography together", () => {
  const source = record();
  const body = source.get("styles").get("text/base/medium");
  body.set("font size", "font/size/1_125");
  body.set("line height", "font/line height/text/1_125");
  body.set("paragraph spacing", "font/paragraph spacing/1_250");
  const text = renderTextCss(source).css;
  const prose = renderProseCss(source);
  const textRule = text.match(/\.stylos-text-base-medium \{([^}]+)\}/)[1];
  const defaultRule = prose.match(/\.stylos-prose \{([^}]+)\}/)[1];
  const explicitRule = prose.match(/\.stylos-prose\[data-text-style="text\/base\/medium"\] \{([^}]+)\}/)[1];
  assert.equal(defaultRule, textRule);
  assert.equal(explicitRule, textRule);
  assert.match(defaultRule, /font-size: var\(--stylos-font-size-1_125\)/);
  assert.match(defaultRule, /--stylos-paragraph-spacing: var\(--stylos-font-paragraph-spacing-1_250\)/);
  assert.doesNotMatch(prose.match(/\.stylos-prose :where\(h1\) \{([^}]+)\}/)[1], /font-stretch/);
});

test("missing, partial and unresolved content styles fail generation instead of inheriting a wrong style", () => {
  for (const breakStyle of [
    (styles) => styles.delete("heading/h6"),
    (styles) => styles.get("text/base/medium").delete("paragraph spacing"),
    (styles) => styles.get("text/emphasis/small").set("unresolved", ["font family"]),
  ]) {
    const source = record();
    breakStyle(source.get("styles"));
    assert.throws(() => renderProseCss(source), /requires text style|missing paragraph spacing|unresolved bindings/);
  }
});

test("every projected typography reference exists in the canonical token set", () => {
  const known = new Set();
  for (const collection of loadCanonical(root.pathname)) {
    for (const name of collection.tokens.keys()) known.add(property(`${collection.name}/${name}`));
  }
  const css = renderProseCss(record());
  for (const [, name] of css.matchAll(/var\((--stylos-[a-z0-9_-]+)/g)) {
    assert.ok(known.has(name) || name === "--stylos-paragraph-spacing", `Unknown CSS token: ${name}`);
  }
});

test("content export adds only approved document margins to complete recorded text styles", () => {
  const source = record();
  const allowed = new Set([...renderTextCss(source).css.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]));
  const css = renderProseCss(source);
  for (const [, declarations] of css.matchAll(/\{([^}]+)\}/g)) {
    if (allowed.has(declarations)) continue;
    for (const line of declarations.trim().split("\n")) {
      assert.match(line.trim(), /^margin-block-(?:start|end): var\(--stylos-(?:dimension-gap-g-(?:0_000|1_000|1_500|2_000|3_000|3_500)|paragraph-spacing)\);$/,
        `Content rule adds a property outside approved spacing: ${line}`);
    }
  }
  const selectors = [...css.matchAll(/(\.stylos-prose[^{}]*)\{/g)].map((match) => match[1]).join("\n");
  assert.doesNotMatch(selectors, /blockquote|table|\bth\b|\btd\b|strong|\bpre\b|\bcode\b/);
});

test("heading gap bindings match the approved guideline profile", () => {
  const guide = readFileSync(new URL("docs/foundations/typography.md", root), "utf8");
  const profile = [...guide.matchAll(/\| `heading\/h([1-6])`, `heading\/h([1-6])` \| `(dimension\/gap\/g-[\d_]+)` \| `(dimension\/gap\/g-[\d_]+)` \|/g)];
  assert.equal(profile.length, 3, "The approved guide defines all three heading pairs");
  const css = renderProseCss(record());
  for (const [, first, second, before, after] of profile) {
    const selector = `.stylos-prose :where(h${first}, h${second})`;
    const declarations = css.slice(css.indexOf(`${selector} {`) + selector.length + 2).split("}")[0];
    assert.ok(css.includes(`${selector} {`), `Missing heading spacing for ${selector}`);
    assert.ok(declarations.includes(`margin-block-start: var(${property(before)});`));
    assert.ok(declarations.includes(`margin-block-end: var(${property(after)});`));
  }
});
