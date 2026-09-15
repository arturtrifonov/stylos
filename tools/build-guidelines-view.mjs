#!/usr/bin/env node
// Renders the guideline set: one index over the whole set, and a page per
// document.
//
//   npm run guidelines:view    # → build/guidelines.html and build/guidelines/
//
// The site already published the inventory — 114 component contracts — and
// not the language they are instances of. This is the other half. Two things
// follow from that being the point:
//
// **Every file is rendered, `Yet to fill` included.** Fifty of the sixty-one
// are a scope line and nothing else. That is the system before alpha, and a
// page that showed only the finished eleven would answer "what is decided"
// while losing "what is left" — which is most of what this set currently is.
//
// **Every rule gets a URL.** The whole grammar of docs/RULES.md exists so a
// contract, a skill or a test can cite `FND-COLOR-08` and have the citation
// checked. Until now that citation resolved only for a reader with the
// repository open. An anchor per ID makes it a link.
//
// The pages carry no script. Like the component pages, they are readable from
// a file:// mount with nothing running.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHROME_CSS, loadChrome, renderSiteFooter, renderSiteHeader } from "./lib/chrome.mjs";
import { siteFacts } from "./lib/site.mjs";
import { loadGuidelines } from "./lib/guidelines.mjs";
import { esc, inline, markdown } from "./lib/markdown.mjs";
import { readFileSync } from "node:fs";

const CSS = `
:root { --gap: 1.6rem; }
body {
  margin: 0 auto;
  padding: 0 2rem 5rem;
  max-width: 62rem;
  background: var(--stylos-background-base, #fff);
  color: var(--stylos-text-base, #101828);
  font-family: var(--stylos-font-normal, system-ui), system-ui, sans-serif;
  line-height: 1.6;
}
main { padding-block-start: 2.5rem; }
h1 { font-size: 2.1rem; line-height: 1.2; margin: 0 0 .4rem; }
h2 { font-size: 1.35rem; margin: 3rem 0 .3rem; }
h3 { font-size: 1.05rem; margin: 0; }
a { color: var(--stylos-text-primary, #4338ca); }
.mono { font-family: var(--stylos-font-code, ui-monospace), ui-monospace, monospace; }
.lede { color: var(--stylos-text-secondary, #475467); margin: 0 0 2rem; max-width: 48rem; }
.scope { color: var(--stylos-text-secondary, #475467); }

/* the tally across the top of the index */
.tally { display: flex; flex-wrap: wrap; gap: 0 2.4rem; margin: 0 0 1rem; padding: 0; list-style: none; }
.tally div { font-size: 1.7rem; font-weight: 600; line-height: 1.2; }
.tally span { color: var(--stylos-text-secondary, #475467); font-size: .85rem; }

/* one row per document */
.files { border-top: 1px solid var(--stylos-border-secondary, #eaecf0); margin-block-start: 1rem; }
.file {
  display: grid;
  grid-template-columns: minmax(10rem, 14rem) 1fr auto;
  gap: .4rem 1.2rem;
  align-items: baseline;
  padding: .75rem 0;
  border-bottom: 1px solid var(--stylos-border-secondary, #eaecf0);
}
.file > .name { font-weight: 600; }
.file > .scope { font-size: .9rem; }
.file > .marks { display: flex; gap: .4rem; white-space: nowrap; }
@media (max-width: 40rem) { .file { grid-template-columns: 1fr; } }

.badge {
  font-size: .72rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: .12rem .45rem;
  border-radius: 3px;
  border: 1px solid var(--stylos-border-secondary, #eaecf0);
  color: var(--stylos-text-secondary, #475467);
}
.badge.confirmed { border-color: var(--stylos-border-success, #067647); color: var(--stylos-text-success, #067647); }
.badge.partial { border-color: var(--stylos-border-warning, #b54708); color: var(--stylos-text-warning, #b54708); }
.badge.count { font-variant-numeric: tabular-nums; }

/* a rule */
.rule {
  border: 1px solid var(--stylos-border-secondary, #eaecf0);
  border-radius: 6px;
  padding: 1.1rem 1.3rem;
  margin: var(--gap) 0;
}
.rule > header { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem .8rem; margin-block-end: .7rem; }
.rule .id {
  font-family: var(--stylos-font-code, ui-monospace), ui-monospace, monospace;
  font-size: .85rem;
  color: var(--stylos-text-secondary, #475467);
  text-decoration: none;
}
.rule .id:hover { text-decoration: underline; }
.level { font-size: .72rem; font-weight: 700; letter-spacing: .06em; }
.level.must { color: var(--stylos-text-danger, #b42318); }
.level.should { color: var(--stylos-text-warning, #b54708); }
.level.may { color: var(--stylos-text-secondary, #475467); }
.level.retired { color: var(--stylos-text-tertiary, #667085); text-decoration: line-through; }
.cite { text-decoration-style: dotted; text-underline-offset: 2px; }
.statement { margin: 0 0 .8rem; }
.why, .note { margin: .6rem 0 0; color: var(--stylos-text-secondary, #475467); font-size: .95rem; }
.why b, .note b { color: var(--stylos-text-base, #101828); font-weight: 600; }
.rule table { border-collapse: collapse; margin: .9rem 0; font-size: .92rem; width: 100%; }
.rule th, .rule td { text-align: left; padding: .35rem .6rem; border-bottom: 1px solid var(--stylos-border-secondary, #eaecf0); vertical-align: top; }
.rule pre {
  background: var(--stylos-background-secondary, #f9fafb);
  padding: .8rem 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: .85rem;
}
code { font-family: var(--stylos-font-code, ui-monospace), ui-monospace, monospace; font-size: .92em; }
.prose table { border-collapse: collapse; margin: 1rem 0; font-size: .92rem; width: 100%; }
.prose th, .prose td { text-align: left; padding: .35rem .6rem; border-bottom: 1px solid var(--stylos-border-secondary, #eaecf0); vertical-align: top; }
.empty {
  border: 1px dashed var(--stylos-border-secondary, #eaecf0);
  border-radius: 6px;
  padding: 1.5rem;
  color: var(--stylos-text-secondary, #475467);
}
`;

const LEVEL_CLASS = { MUST: "must", SHOULD: "should", MAY: "may", RETIRED: "retired" };

const statusBadge = (status) => {
  if (!status) return "";
  const kind = status === "Confirmed" ? "confirmed" : status === "Partial" ? "partial" : "";
  return `<span class="badge ${kind}">${esc(status)}</span>`;
};

/**
 * Where a link written for a reader of the repository should go on the site.
 *
 * A guideline links two kinds of thing: another guideline, which has a page
 * here, and a file of the repository — `tokens/README.md`, a tool — which does
 * not. The first becomes the page; the second becomes the file on GitHub when
 * package.json records a repository, and is left alone when it does not. A
 * link that resolves to nothing is worse than no link, and stripping them
 * would quietly delete half the reasoning.
 */
export function linkRewriter({ file, prefix, slugs, repoUrl, branch = "master" }) {
  const dir = path.posix.dirname(file);
  return (target) => {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(target)) return target;

    const [pathPart, fragment = ""] = target.split("#");
    const hash = fragment ? `#${fragment}` : "";
    if (pathPart === "") return hash;

    const resolved = path.posix.normalize(path.posix.join(dir, pathPart));
    const slug = resolved.replace(/^docs\//, "").replace(/\.md$/, "");
    if (resolved.endsWith(".md") && slugs.has(slug)) return `${prefix}guidelines/${slug}.html${hash}`;

    return repoUrl ? `${repoUrl}/blob/${branch}/${resolved}${hash}` : target;
  };
}

// An ID written as bare text is a citation (RUL-11). On a page it can be the
// thing it names, which is what the whole grammar was for.
const CITATION = /\b((?:PRN|RUL|STD)-\d{2}|(?:FND|BEH|PAT|CNT)-[A-Z]+(?:-[A-Z]+)*-\d{2})\b/g;

/**
 * Turn every cited ID in a rendered fragment into a link to the rule.
 *
 * Anything already inside a link or a code span is left alone: a code span is
 * a specimen rather than a citation — the same reading `validate-rules.mjs`
 * takes — and a link that already went somewhere is not improved by a second.
 */
export function linkCitations(html, urlFor) {
  // The last alternative is every other tag. Without it an ID inside an
  // attribute — `id="RUL-01"` — is read as a text node and rewritten into a
  // nested anchor, which is exactly what happened the first time.
  return String(html).replace(
    /(<a\b[^>]*>[\s\S]*?<\/a>|<code>[\s\S]*?<\/code>|<[^>]*>)|([^<]+)/g,
    (match, protectedRun, text) => {
      if (protectedRun) return protectedRun;
      if (!text) return match;
      return text.replace(CITATION, (id) => {
        const url = urlFor(id);
        return url ? `<a class="cite" href="${esc(url)}">${id}</a>` : id;
      });
    }
  );
}

/** The relative prefix from a page back to the root of the tree. */
const prefixFor = (slug) => "../".repeat(slug.split("/").length);

function shell({ title, theme, chromeCss, header, footer, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${theme}${chromeCss}${CSS}</style>
</head>
<body>
${header}
${body}
${footer}
</body>
</html>
`;
}

/** One rule, as a card with its ID as the anchor. */
export function renderRule(rule, { linkTo = "", href } = {}) {
  const level = LEVEL_CLASS[rule.level] ?? "may";
  const parts = [
    `<header>`,
    `<h3>${esc(rule.title)}</h3>`,
    `<a class="id" href="${esc(linkTo)}#${esc(rule.id)}">${esc(rule.id)}</a>`,
    rule.level ? `<span class="level ${level}">${esc(rule.level)}</span>` : "",
    `</header>`,
    `<p class="statement">${inline(rule.statement.replace(/^\*\*[A-Z]+\.?\*\*\s*/, ""), { href })}</p>`,
  ];

  if (rule.why) parts.push(`<p class="why"><b>Why:</b> ${inline(rule.why, { href })}</p>`);
  if (rule.body.length > 0)
    parts.push(`<div class="prose">${markdown(rule.body, { headingLevel: 4, href })}</div>`);
  for (const exception of rule.exceptions) {
    parts.push(`<p class="note"><b>Exception:</b> ${inline(exception, { href })}</p>`);
  }
  if (rule.checkedBy) parts.push(`<p class="note"><b>Checked by:</b> ${inline(rule.checkedBy, { href })}</p>`);
  if (rule.serves) parts.push(`<p class="note"><b>Serves:</b> ${inline(rule.serves, { href })}</p>`);

  return `<section class="rule" id="${esc(rule.id)}">\n${parts.filter(Boolean).join("\n")}\n</section>`;
}

/**
 * One document, prose and all.
 *
 * The prose between the rules is most of what some of these files are — the
 * table of colour areas, the eleven naming bands — so the page renders the
 * document rather than only its rule blocks. Rule blocks become cards; every
 * other line is rendered where it stands.
 */
export function renderDocumentBody(text, rules, { href } = {}) {
  const lines = text.split("\n");
  const byLine = new Map(rules.map((rule) => [rule.line, rule]));

  const out = [];
  let prose = [];
  const flush = () => {
    const rendered = markdown(prose, { headingLevel: 3, href });
    if (rendered.trim() !== "") out.push(`<div class="prose">${rendered}</div>`);
    prose = [];
  };

  // The `# Title`, `Status:` and `Scope:` lines of RUL-15 become the page
  // header, so they are consumed here rather than rendered a second time.
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    if (/^#\s/.test(line) || /^Status:/.test(line) || /^Scope:/.test(line)) continue;
    break;
  }

  for (; i < lines.length; i++) {
    const rule = byLine.get(i + 1);
    if (rule) {
      flush();
      out.push(renderRule(rule, { href }));
      i += rule.span;
      i--;
      continue;
    }
    prose.push(lines[i]);
  }
  flush();
  return out.join("\n");
}

export function buildGuidelinesData(root, { generated = "", repoUrl = null } = {}) {
  const set = loadGuidelines(root);
  const homes = new Map();
  for (const file of set.files) for (const rule of file.rules) homes.set(rule.id, file.slug);
  const texts = new Map(
    set.files.map((file) => [file.slug, readFileSync(path.join(root, file.file), "utf8")])
  );
  return { ...set, texts, generated, repoUrl, homes, slugs: new Set(set.files.map((file) => file.slug)) };
}

export function renderIndex(data, chrome = {}) {
  const { totals, areas, generated } = data;

  const href = linkRewriter({ file: "docs/README.md", prefix: "", slugs: data.slugs ?? new Set(), repoUrl: data.repoUrl });

  const sections = areas.map((area) => {
    const written = area.files.filter((file) => file.rules.length > 0).length;
    const rows = area.files
      .map((file) => {
        const count = file.rules.length;
        const checked = file.rules.filter((rule) => rule.checkedBy !== "").length;
        return `<div class="file">
  <div class="name"><a href="guidelines/${esc(file.slug)}.html">${esc(file.title)}</a></div>
  <div class="scope">${file.scope ? inline(file.scope, { href: linkRewriter({ file: file.file, prefix: "", slugs: data.slugs ?? new Set(), repoUrl: data.repoUrl }) }) : "<em>No scope line</em>"}</div>
  <div class="marks">${statusBadge(file.status)}${
    count > 0 ? `<span class="badge count">${count} rule${count === 1 ? "" : "s"}</span>` : ""
  }${checked > 0 ? `<span class="badge count">${checked} checked</span>` : ""}</div>
</div>`;
      })
      .join("\n");

    return `<h2 id="${esc(area.area)}">${esc(area.label)}</h2>
<p class="lede">${esc(area.blurb)}${
      area.files.length > 1 ? ` — ${written} of ${area.files.length} written.` : "."
    }</p>
<div class="files">
${rows}
</div>`;
  });

  return shell({
    title: "Guidelines — Stylos",
    theme: chrome.themeCss ?? "",
    chromeCss: chrome.siteHeader ? CHROME_CSS : "",
    header: chrome.siteHeader ?? "",
    footer: chrome.siteFooter ?? "",
    body: `<main>
<h1>Guidelines</h1>
<p class="lede">The rules the components are instances of. Every file in the set is here, including the ones that hold nothing yet: a file with a scope line and no rules says a decision belongs there and has not been made, and before alpha that is most of them. Generated from <span class="mono">docs/</span>${
      generated ? ` on ${esc(generated)}` : ""
    }.</p>
<ul class="tally">
  <li><div>${totals.rules}</div><span>rules</span></li>
  <li><div>${totals.checked}</div><span>with a check</span></li>
  <li><div>${totals.written}</div><span>files written</span></li>
  <li><div>${totals.empty}</div><span>yet to fill</span></li>
</ul>
${sections.join("\n")}
</main>`,
  });
}

export function renderPage(file, data, chrome = {}) {
  const text = data.texts.get(file.slug) ?? "";
  const prefix = prefixFor(file.slug);
  const href = linkRewriter({
    file: file.file,
    prefix,
    slugs: data.slugs ?? new Set(),
    repoUrl: data.repoUrl,
  });

  const cite = (id) => {
    const slug = data.homes?.get(id);
    if (!slug) return null;
    return slug === file.slug ? `#${id}` : `${prefix}guidelines/${slug}.html#${id}`;
  };

  const body =
    file.rules.length > 0
      ? linkCitations(renderDocumentBody(text, file.rules, { href }), cite)
      : `<div class="empty"><p>Nothing is decided here yet. The file exists so that the rule which belongs in it is not written in a component contract or in whichever document its author happened to have open.</p></div>`;

  return shell({
    title: `${file.title} — Stylos guidelines`,
    theme: chrome.themeCss ?? "",
    chromeCss: chrome.siteHeader ? CHROME_CSS : "",
    header: chrome.siteHeader ?? "",
    footer: chrome.siteFooter ?? "",
    body: `<main>
<p class="scope"><a href="${prefix}guidelines.html">Guidelines</a></p>
<h1>${esc(file.title)}</h1>
<p class="lede">${file.scope ? inline(file.scope, { href }) : ""}</p>
<p class="scope">${statusBadge(file.status)} <span class="mono">${esc(file.file)}</span></p>
${body}
</main>`,
  });
}

/** Every guideline page, keyed by its path under `build/guidelines/`. */
export function buildGuidelinePages(data, chromeFor) {
  const pages = new Map();
  for (const file of data.files) {
    pages.set(`${file.slug}.html`, renderPage(file, data, chromeFor(file)));
  }
  return pages;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const generated = new Date().toISOString().slice(0, 10);
  const data = buildGuidelinesData(root, { generated, repoUrl: siteFacts(root).repo });

  const out = path.join(root, "build");
  const write = (relative, html) => {
    const file = path.join(out, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
  };

  const site = siteFacts(root);
  const chromeFor = (prefix, active) => ({
    ...loadChrome(root, { prefix }),
    siteHeader: renderSiteHeader({
      prefix,
      active,
      logo: loadChrome(root, { prefix }).logo,
      storybook: site.storybook,
      figmaUrl: site.figmaMain,
      repoUrl: site.repo,
    }),
    siteFooter: renderSiteFooter({ generated, version: site.version, repoUrl: site.repo }),
  });

  write("guidelines.html", renderIndex(data, chromeFor("", "guidelines")));
  const pages = buildGuidelinePages(data, (file) => chromeFor(prefixFor(file.slug), "guidelines"));
  for (const [relative, html] of pages) write(path.join("guidelines", relative), html);

  console.log(`${data.totals.rules} rules in ${data.totals.files} files → build/guidelines.html and build/guidelines/`);
}

export { prefixFor };
