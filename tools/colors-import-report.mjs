#!/usr/bin/env node
// Spike (PLAN.md §4.4): report what Colors recognises in a token export.
//
//   npm run colors:import-report -- "Light.tokens.json" "Dark.tokens.json" …
//   npm run colors:import-report -- path/to/export-folder
//   npm run colors:import-report -- --sample tonal      (or --samples for all)
//   add --json for the raw result
//
// Read-only: nothing is written.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { readDocuments } from '../apps/colors/src/import/read.mjs'
import { recognise } from '../apps/colors/src/import/infer.mjs'
import { formatRecognition } from '../apps/colors/src/import/report.mjs'
import { SAMPLES } from './lib/colors-import-samples.mjs'

const args = process.argv.slice(2)
const json = args.includes('--json')
const sets = []
if (args.includes('--samples')) for (const name of Object.keys(SAMPLES)) sets.push([name, SAMPLES[name]()])
const sample = args.indexOf('--sample')
if (sample >= 0) {
  const name = args[sample + 1]
  if (!SAMPLES[name]) { console.error(`Unknown sample. Choose one of: ${Object.keys(SAMPLES).join(', ')}.`); process.exit(2) }
  sets.push([name, SAMPLES[name]()])
}
const paths = args.filter((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--sample')
  .flatMap(arg => statSync(arg).isDirectory() ? readdirSync(arg).filter(f => f.endsWith('.json')).map(f => path.join(arg, f)) : [arg])
if (paths.length) sets.push(['files', paths.map(p => ({ name: path.basename(p), document: JSON.parse(readFileSync(p, 'utf8')) }))])
if (!sets.length) { console.error('Give token files, a folder, --sample <name> or --samples.'); process.exit(2) }

for (const [name, inputs] of sets) {
  const result = recognise(readDocuments(inputs))
  if (json) console.log(JSON.stringify({ name, ...result }, null, 2))
  else console.log(`== ${name}\n${formatRecognition(result)}\n`)
}
