// Plain-text form of a recognition result: what the review screen would show.

const list = (items, empty = 'none') => items.length ? items.join(', ') : empty
const plural = (n, word) => `${n} ${n === 1 ? word : word.endsWith('y') ? word.slice(0, -1) + 'ies' : word + 's'}`
const ARRANGEMENTS = {
  shared: 'one palette serves every theme; themes exist only in the roles',
  modes: 'each theme reads its own mode of one palette collection',
  parallel: 'each theme reads its own palette collection',
  single: 'one theme',
}

/** @param {ReturnType<typeof import('./infer.mjs').recognise>} result */
export function formatRecognition(result) {
  const lines = [`${plural(result.files, 'file')}, ${plural(result.collections.length, 'collection')}.`, '', 'Collections']
  for (const c of result.collections) {
    const name = c.name ? `${c.name}${c.nameSource === 'file' ? ' (from file names)' : ''}` : `${c.id} (name not in the export)`
    lines.push(`  ${name}: ${c.kind}; modes ${list(c.modes.map(String))}; ${c.literal} literal, ${c.alias} alias${c.other ? `, ${c.other} not colour` : ''}`)
  }
  for (const p of result.palettes) {
    const opaque = p.ramps.filter(r => !r.alpha)
    lines.push('', `Palette ${p.id}`)
    lines.push(`  ${plural(opaque.length, 'ramp')}${p.namespace ? ` under ${p.namespace}/` : ''}: ${list(opaque.map(r => r.name))}`)
    lines.push(`  Steps: ${list(p.scale)} (${p.direction ?? 'no direction'})`)
    const alpha = p.ramps.filter(r => r.alpha)
    if (alpha.length) lines.push(`  Alpha ramps: ${list(alpha.map(r => r.variantOf ? `${r.name} (alpha of ${r.variantOf.name})` : r.name))}`)
    const variants = opaque.filter(r => r.variantOf)
    if (variants.length) lines.push(`  Variants: ${list(variants.map(r => `${r.name} of ${r.variantOf.name}`))}`)
    for (const d of p.deviations) lines.push(`  ${d.group}: missing ${list(d.missing)}; extra ${list(d.extra)}`)
    if (p.loose.length) lines.push(`  Loose colours: ${list(p.loose)}`)
  }
  for (const r of result.roles) {
    lines.push('', `Roles ${r.id}: ${plural(r.count, 'role')}`)
    lines.push(`  Themes: ${list(r.themes.map(t => `${t.mode} → ${t.palette ?? '?'}${t.paletteMode && t.paletteMode !== t.mode ? ` [${t.paletteMode}]` : ''}`))}`)
    lines.push(`  Arrangement: ${ARRANGEMENTS[r.arrangement]}`)
    lines.push(`  Areas: ${list(Object.entries(r.areas).map(([area, n]) => `${area} ${n}`))}`)
    lines.push(`  States: ${list(r.stateWords)}; ${plural(r.stateFamilies, 'family')} with two or more`)
    lines.push(`  Kinds: ${list(Object.entries(r.kinds).map(([kind, n]) => `${kind} ${n}`))}`)
    if (r.literal) lines.push(`  ${plural(r.literal, 'literal value')} instead of a binding`)
    if (r.chained) lines.push(`  ${plural(r.chained, 'binding')} through another role`)
    const consistent = r.perHue.filter(t => t.consistent)
    if (consistent.length) {
      lines.push(`  Per-hue families: ${consistent.length}`)
      for (const t of consistent) lines.push(`    ${t.template}: ${list(Object.entries(t.modes).map(([mode, step]) => `${mode} ${step}`))} (${t.hues.length} hues)`)
      if (r.excludedHues.length) lines.push(`    Hues outside every family: ${list(r.excludedHues)}`)
    }
    const irregular = r.perHue.filter(t => !t.consistent)
    if (irregular.length) lines.push(`  Hue-named roles without a shared step: ${list(irregular.map(t => t.template))}`)
  }
  lines.push('', result.issues.length ? 'Issues' : 'No issues.')
  for (const issue of result.issues) lines.push(`  ${issue.level}: ${issue.message}`)
  return lines.join('\n')
}
