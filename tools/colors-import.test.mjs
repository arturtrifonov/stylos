import test from 'node:test'
import assert from 'node:assert/strict'
import { readDocument, readDocuments } from '../apps/colors/src/import/read.mjs'
import { recognise } from '../apps/colors/src/import/infer.mjs'
import { formatRecognition } from '../apps/colors/src/import/report.mjs'
import { SAMPLES } from './lib/colors-import-samples.mjs'

const run = name => recognise(readDocuments(SAMPLES[name]()))
const kinds = result => result.collections.map(c => c.kind)

test('shared primitives: one single-mode palette, themes only in the roles', () => {
  const result = run('shared-primitives')
  assert.deepEqual(kinds(result), ['palette', 'roles'])
  const [palette] = result.palettes
  assert.equal(palette.ramps.length, 10)
  assert.equal(palette.namespace, 'colors')
  assert.deepEqual(palette.scale, ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'])
  assert.equal(palette.direction, 'light-to-dark')
  assert.deepEqual(palette.loose.sort(), ['colors/black', 'colors/white'])
  const [roles] = result.roles
  assert.equal(roles.arrangement, 'shared')
  assert.deepEqual(roles.themes.map(t => t.mode), ['Light', 'Dark'])
  assert.equal(roles.stateFamilies, 2)
  assert.equal(roles.kinds['shadow (scope)'], 1)
  assert.equal(roles.kinds.unknown, 8, 'ALL_SCOPES roles with no telling name stay unknown rather than guessed')
  assert.deepEqual(result.issues, [])
})

test('tonal palettes: dark-to-light tones, a finer neutral, a per-key role family', () => {
  const result = run('tonal')
  const [palette] = result.palettes
  assert.equal(palette.direction, 'dark-to-light')
  assert.equal(palette.deviations.length, 1)
  assert.equal(palette.deviations[0].group, 'ref/palette/neutral')
  assert.equal(palette.ramps.find(r => r.name === 'neutral-variant').variantOf.name, 'neutral')
  const [roles] = result.roles
  assert.equal(roles.arrangement, 'shared')
  const family = roles.perHue.find(t => t.template === 'sys/color/{hue}')
  assert(family.consistent)
  assert.deepEqual(family.modes, { Light: '{hue}/40', Dark: '{hue}/80' })
  assert.deepEqual(roles.excludedHues, ['neutral', 'neutral-variant'])
})

test('twelve-step scales: themes as modes of one collection, alpha ramps, non-colour collections set aside', () => {
  const result = run('scales')
  assert.deepEqual(kinds(result), ['palette', 'roles', 'other'])
  const [palette] = result.palettes
  assert.equal(palette.ramps.filter(r => r.alpha).length, 2)
  assert.equal(palette.ramps.find(r => r.name === 'blueA').variantOf.name, 'blue')
  const [roles] = result.roles
  assert.equal(roles.arrangement, 'modes')
  assert.deepEqual(roles.themes.map(t => t.paletteMode), ['Light', 'Dark'])
  assert.equal(roles.perHue.filter(t => t.consistent).length, 5)
  assert.deepEqual(roles.excludedHues, ['gray'])
})

test('Stylos: parallel palette collections and the eleven lines of the special scale', () => {
  const result = run('stylos')
  assert.deepEqual(kinds(result), ['palette', 'palette', 'roles', 'roles'])
  assert.deepEqual(result.palettes.map(p => p.direction), ['light-to-dark', 'dark-to-light'])
  for (const palette of result.palettes) {
    assert.equal(palette.ramps.length, 22)
    assert.deepEqual(palette.loose.sort(), ['mono/black', 'mono/white'])
  }
  const [semantic, special] = result.roles
  assert.equal(semantic.arrangement, 'parallel')
  assert.deepEqual(semantic.themes.map(t => t.palette), ['palette.light', 'palette.dark'])
  const families = special.perHue.filter(t => t.consistent)
  assert.equal(families.length, 11)
  assert.equal(families.find(t => t.template === 'surface/bold/special/{hue}/disabled').modes['color.light'], 'slate/100',
    'a disabled line names a fixed step, not its own hue (FND-COLOR-08)')
  assert.deepEqual(result.issues, [])
})

test('plain DTCG references and hex strings read without Figma extensions', () => {
  const palette = readDocument({ blue: { 100: { $type: 'color', $value: '#dbeafe' }, 500: { $type: 'color', $value: '#3b82f6' }, 900: { $type: 'color', $value: '#1e3a8a' } } }, 'palette.json')
  const roles = readDocument({ accent: { $type: 'color', $value: '{blue.500}' } }, 'roles.json')
  assert.deepEqual(roles.tokens.get('accent').alias, { collection: null, path: 'blue/500' })
  const result = recognise([palette, roles])
  assert.deepEqual(kinds(result), ['palette', 'roles'])
  assert.equal(result.roles[0].themes[0].palette, result.collections[0].id)
  assert.deepEqual(result.issues, [])
})

test('problems are reported, not guessed past', () => {
  const p3 = readDocument({ $extensions: { 'com.figma.modeName': 'Mode 1' }, red: { $type: 'color', $value: { colorSpace: 'display-p3', components: [1, 0, 0], alpha: 1 } } }, 'Mode 1.tokens.json')
  const dangling = readDocument({ $extensions: { 'com.figma.modeName': 'Light' }, text: { $type: 'color', $value: '{nowhere.1}' } }, 'Light.tokens.json')
  const result = recognise([p3, dangling])
  assert(result.issues.some(issue => issue.level === 'error' && issue.message.includes('display-p3')))
  assert(result.issues.some(issue => issue.level === 'error' && issue.message.includes('nowhere/1')))
})

test('two files with one path set and one mode name are two collections', () => {
  const doc = hex => ({ $extensions: { 'com.figma.modeName': 'Mode 1' }, gray: Object.fromEntries([1, 2, 3].map(i => [i, { $type: 'color', $value: hex }])) })
  const result = recognise(readDocuments([{ name: 'Mode 1.tokens.json', document: doc('#eeeeee') }, { name: 'Mode 1.tokens.json', document: doc('#111111') }]))
  assert.equal(result.collections.length, 2)
})

test('the report names every section it found', () => {
  const text = formatRecognition(run('stylos'))
  for (const part of ['Collections', 'Palette palette.light', 'Roles color.special', 'Per-hue families: 11', 'No issues.']) assert(text.includes(part), part)
})
