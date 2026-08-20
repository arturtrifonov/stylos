#!/usr/bin/env node
// Compiles skills/src/<skill>/SKILL.md sources into one Figma Agent-importable
// document, in the order declared by skills/targets/figma-agent.md.
//
// Usage:
//   node tools/build-skills.mjs          build dist/stylos-figma-agent.md
//   node tools/build-skills.mjs --check  fail if dist/ is missing or stale

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const targetPath = path.join(root, "skills/targets/figma-agent.md");
const srcDir = path.join(root, "skills/src");
const distPath = path.join(root, "skills/dist/stylos-figma-agent.md");

function parseIncludeOrder(targetSource) {
  const lines = targetSource.split("\n");
  const start = lines.findIndex((l) => l.trim() === "## Include order");
  if (start === -1) {
    throw new Error(`No "## Include order" section found in ${targetPath}`);
  }
  const names = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const match = line.match(/^-\s+(\S+)/);
    if (match) names.push(match[1]);
  }
  if (names.length === 0) {
    throw new Error(`"## Include order" in ${targetPath} lists no skills`);
  }
  return names;
}

function parseFrontmatter(skillSource, skillName) {
  const match = skillSource.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error(`${skillName}/SKILL.md has no YAML frontmatter`);
  }
  const nameMatch = match[1].match(/^name:\s*(.+)$/m);
  const versionMatch = match[1].match(/^\s*version:\s*(.+)$/m);
  if (!nameMatch || !versionMatch) {
    throw new Error(
      `${skillName}/SKILL.md frontmatter is missing "name" or "metadata.version"`
    );
  }
  return { name: nameMatch[1].trim(), version: versionMatch[1].trim() };
}

function build() {
  const targetSource = readFileSync(targetPath, "utf8");
  const includeOrder = parseIncludeOrder(targetSource);

  const skills = includeOrder.map((skillDir) => {
    const skillPath = path.join(srcDir, skillDir, "SKILL.md");
    if (!existsSync(skillPath)) {
      throw new Error(
        `Include order references "${skillDir}" but ${skillPath} does not exist`
      );
    }
    const source = readFileSync(skillPath, "utf8");
    const { name, version } = parseFrontmatter(source, skillDir);
    return { dir: skillDir, name, version, source: source.trimEnd() };
  });

  const toc = skills
    .map((s) => `- \`${s.name}\` v${s.version}`)
    .join("\n");

  const header = [
    "<!--",
    "  GENERATED FILE. Do not edit directly.",
    "  Source: skills/src/*/SKILL.md, compiled by tools/build-skills.mjs",
    "  Order:  skills/targets/figma-agent.md",
    "  To change this document, edit the sources and run `npm run build:skills`.",
    "-->",
    "",
    "# Stylos — Figma Agent Skills",
    "",
    "Compiled skill document for manual import into Figma Agent. Contains:",
    "",
    toc,
    "",
    "---",
  ].join("\n");

  const body = skills.map((s) => s.source).join("\n\n---\n\n");

  return `${header}\n\n${body}\n`;
}

const output = build();
const checkOnly = process.argv.includes("--check");

if (checkOnly) {
  if (!existsSync(distPath)) {
    console.error(`FAIL: ${distPath} does not exist. Run: npm run build:skills`);
    process.exit(1);
  }
  const current = readFileSync(distPath, "utf8");
  if (current !== output) {
    console.error(
      `FAIL: ${distPath} is stale relative to skills/src/. Run: npm run build:skills`
    );
    process.exit(1);
  }
  console.log("OK: skills/dist/stylos-figma-agent.md is up to date.");
} else {
  writeFileSync(distPath, output, "utf8");
  console.log(`Wrote ${path.relative(root, distPath)}`);
}
