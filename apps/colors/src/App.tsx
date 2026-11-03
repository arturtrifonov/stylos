import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Scale } from './huetone/components/ColorGraph'
import { colorSpaces } from './huetone/shared/colorFuncs'
import { spaceName } from './huetone/shared/types'
import type { Channel, LCH } from './huetone/shared/types'
import { paletteStore } from './huetone/store/palette'
import { chartSettingsStore } from './huetone/store/chartSettings'
import { MODES, createDraft, exportChanges, importChanges, resolveRole, colorCss, withDraftRoles, addHue, addStep, rampPaths as pathsForHue } from './model.mjs'
import type { Snapshot, Palette, Theme, Role, Coordinates, ChangeSet } from './model.mjs'
import { editorColor, coordinateKey, outsideSrgb, validateProjections, interpolatedStep } from './editing'
import { draftFromFigmaBundle } from './figma-bundle.mjs'
import { createHistory, recordHistory, undoHistory, redoHistory } from './history.mjs'
import { groupRoles, roleLabel, ROLE_STATES } from './role-groups.mjs'
import { wcagContrast } from './huetone/shared/color'
import { ServerWorkspace } from './ServerWorkspace'
import { FigmaExport } from './FigmaExport'
import { useGrayscalePreview } from './useGrayscalePreview'

const STORAGE = 'stylos.colors.draft.v1'
const HEX = /^#[0-9a-f]{6}$/i
type View = 'Palette' | 'Semantic' | 'Special' | 'Changes'
type PreviewColor = (value: string, path?: string) => string
const CHANNEL_NAMES: Record<Channel, string> = { l: 'Lightness', c: 'Chroma', h: 'Hue' }

function rolePreviewCss(color: ReturnType<typeof resolveRole>, previewColor: PreviewColor) {
  return colorCss({ ...color, value: previewColor(color.value, color.ref.slice('palette/'.length)) })
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 1000)
}

function restore(snapshot: Snapshot) {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE)
    const input = saved ? JSON.parse(saved) as ChangeSet : null
    const draft = input ? importChanges(snapshot, input) : createDraft(snapshot)
    const coordinates = input?.coordinates ?? {}
    validateProjections(draft, coordinates)
    return { draft, coordinates, problem: '', recovery: '' }
  } catch (error) {
    return { draft: createDraft(snapshot), coordinates: {} as Coordinates, problem: `Saved draft: ${(error as Error).message}`, recovery: saved ?? '' }
  }
}

export function App({ snapshot }: { snapshot: Snapshot }) {
  const [initial] = useState(() => restore(snapshot))
  const [history, setHistory] = useState(() => createHistory({ palette: initial.draft, coordinates: initial.coordinates }, { palette: createDraft(snapshot), coordinates: {} }))
  const { palette: draft, coordinates } = history.present
  const editGroup = useRef<string | null>(null)
  const editSequence = useRef(0)
  const [adding, setAdding] = useState<'row' | 'step' | null>(null)
  const [newName, setNewName] = useState('')
  const [theme, setTheme] = useState<Theme>('light')
  const [view, setView] = useState<View>('Palette')
  const [selection, setSelected] = useState('indigo/700' in snapshot.palette ? 'indigo/700' : Object.keys(snapshot.palette)[0])
  const [space, setSpace] = useState(spaceName.oklch)
  const [showColors, setShowColors] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { grayscale, toggleGrayscale } = useGrayscalePreview()
  const [notice, setNotice] = useState(initial.problem)
  const [recovery, setRecovery] = useState(initial.recovery)
  const [storageAvailable, setStorageAvailable] = useState(!initial.problem)
  const [filter, setFilter] = useState('')
  const [comparePath, setComparePath] = useState('background/base')
  const [presentation, setPresentation] = useState<'context' | 'swatches'>('context')
  const selected = draft[selection] ? selection : Object.keys(draft)[0]
  const inputRef = useRef<HTMLInputElement>(null)
  const patch = useMemo(() => exportChanges(snapshot, draft, coordinates), [snapshot, draft, coordinates])
  const project = useMemo(() => withDraftRoles(snapshot, draft), [snapshot, draft])
  const hues = useMemo(() => [...new Set(Object.keys(draft).map(path => path.split('/')[0]))], [draft])
  const editedCount = new Set([...patch.changes.map(change => coordinateKey(change.path.slice(8), change.mode)), ...Object.keys(coordinates)]).size
  const outside = Object.keys(draft).filter(path => outsideSrgb(coordinates, path, theme))
  const isNew = !snapshot.palette[selected]
  const isNewHue = !Object.keys(snapshot.palette).some(path => path.startsWith(`${selected.split('/')[0]}/`))
  const hue = selected.split('/')[0]
  const rampPaths = useMemo(() => pathsForHue(draft, hue), [draft, hue])
  const selectedIndex = rampPaths.indexOf(selected)
  const colorSpace = colorSpaces[space]
  const grayPalette = useMemo(() => grayscale ? Object.fromEntries(Object.keys(draft).map(path => [path,
    colorSpaces[space].lch2color([editorColor(draft, coordinates, path, theme, space).l, 0, 0]).hex,
  ])) : null, [grayscale, draft, coordinates, theme, space])
  const previewColor: PreviewColor = (value, path) => {
    if (!grayscale) return value
    if (path && grayPalette?.[path]) return grayPalette[path]
    const color = HEX.test(value) ? colorSpace.hex2color(value) : null
    return color ? colorSpace.lch2color([color.l, 0, 0]).hex : value
  }
  const colors = useMemo(() => rampPaths.map(path => editorColor(draft, coordinates, path, theme, space)), [rampPaths, coordinates, draft, theme, space])
  const dependent = project.roles.filter(role => (role.ref[theme] ?? role.ref.default) === `palette/${selected}`)
  const groupedRoles = useMemo(() => groupRoles(project.roles, view === 'Special', filter), [project, view, filter])
  const backgroundPath = project.roles.some(role => role.path === comparePath) ? comparePath : 'background/base'

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    paletteStore.set({ mode: space, name: 'Stylos', hues: [hue], tones: rampPaths.map(path => path.split('/')[1]), colors: [colors] })
  }, [colors, hue, rampPaths, space])
  useEffect(() => { chartSettingsStore.setKey('showColors', showColors) }, [showColors])
  useEffect(() => {
    // Never replace an unreadable/stale saved draft on startup.
    if (!storageAvailable) return
    try {
      if (editedCount) localStorage.setItem(STORAGE, JSON.stringify(patch))
      else localStorage.removeItem(STORAGE)
    } catch {
      setStorageAvailable(false)
      setNotice('Browser storage is unavailable. Save a draft file to keep your changes.')
    }
  }, [patch, editedCount, storageAvailable])

  useEffect(() => {
    const release = () => { editGroup.current = null }
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const textInput = target instanceof HTMLTextAreaElement || target?.isContentEditable ||
        target instanceof HTMLSelectElement || target instanceof HTMLInputElement && !['range', 'number', 'color', 'checkbox', 'button'].includes(target.type)
      if (textInput || !(event.ctrlKey || event.metaKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      event.preventDefault()
      release()
      setHistory(key === 'y' || event.shiftKey ? redoHistory : undoHistory)
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    window.addEventListener('keydown', shortcut)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
      window.removeEventListener('keydown', shortcut)
    }
  }, [])

  function beginEdit() {
    if (!editGroup.current) editGroup.current = `edit-${++editSequence.current}`
  }
  function endEdit() { editGroup.current = null }
  function commitEditor(next: Palette, points: Coordinates, merge = false) {
    const group = merge ? editGroup.current : null
    setHistory(current => recordHistory(current, { palette: next, coordinates: points }, group))
  }
  function undo() { endEdit(); setHistory(undoHistory); setNotice('') }
  function redo() { endEdit(); setHistory(redoHistory); setNotice('') }
  function edit(path: string, mode: Theme, value: string, merge = true) {
    const points = { ...coordinates }
    delete points[coordinateKey(path, mode)]
    commitEditor({ ...draft, [path]: { ...draft[path], [mode]: value.toLowerCase() } }, points, merge)
  }
  function editLch(index: number, lch: LCH) {
    const path = rampPaths[index]
    setSelected(path)
    const nextPoints = { ...coordinates, [coordinateKey(path, theme)]: { space, lch } }
    const next = { ...draft, [path]: { ...draft[path], [theme]: colorSpace.lch2color(lch).hex } }
    commitGraph(next, nextPoints, true)
  }
  function commitGraph(next: Palette, points: Coordinates, merge = false) {
    try {
      exportChanges(snapshot, next, points)
      commitEditor(next, points, merge)
    } catch (error) { setNotice((error as Error).message) }
  }
  function makeDisplayable() {
    const points = Object.fromEntries(Object.entries(coordinates).filter(([key]) => {
      const [mode, path] = key.split(':')
      return mode !== theme || !outside.includes(path)
    }))
    commitEditor(draft, points)
    setNotice(`Made ${outside.length} color${outside.length === 1 ? '' : 's'} displayable in ${theme} mode.`)
  }
  function applyChannel(channel: 'h' | 'l') {
    const selectedColor = editorColor(draft, coordinates, selected, theme, space)
    const targets = channel === 'h' ? rampPaths : Object.keys(draft).filter(path => path.split('/')[1] === selected.split('/')[1])
    const next = structuredClone(draft)
    const points = { ...coordinates }
    for (const path of targets) {
      const color = editorColor(draft, coordinates, path, theme, space)
      const lch: LCH = [channel === 'l' ? selectedColor.l : color.l, color.c, channel === 'h' ? selectedColor.h : color.h]
      points[coordinateKey(path, theme)] = { space, lch }
      next[path][theme] = colorSpace.lch2color(lch).hex
    }
    commitGraph(next, points)
  }
  function add() {
    try {
      if (adding === 'row') {
        const fromHue = hue === 'mono' ? hues.find(group => group !== 'mono')! : hue
        const next = addHue(draft, newName.trim(), fromHue)
        const extra: Coordinates = {}
        for (const path of pathsForHue(draft, fromHue)) for (const mode of MODES) {
          const point = coordinates[coordinateKey(path, mode)]
          if (point) extra[coordinateKey(`${newName.trim()}/${path.split('/')[1]}`, mode)] = structuredClone(point)
        }
        commitEditor(next, { ...coordinates, ...extra })
        setSelected(`${newName.trim()}/${pathsForHue(draft, fromHue)[0].split('/')[1]}`)
      } else {
        const step = newName.trim()
        commitEditor(addStep(draft, step, (group, mode) => interpolatedStep(draft, coordinates, group, step, mode, space)), coordinates)
        setSelected(`${hue === 'mono' ? hues.find(group => group !== 'mono') : hue}/${step}`)
      }
      setAdding(null)
      setNewName('')
    } catch (error) { setNotice((error as Error).message) }
  }
  function removeAddition(path: string) {
    const [group, step] = path.split('/')
    const newGroup = !Object.keys(snapshot.palette).some(key => key.startsWith(`${group}/`))
    const remove = (key: string) => newGroup ? key.startsWith(`${group}/`) : key.split('/')[1] === step
    const next = Object.fromEntries(Object.entries(draft).filter(([key]) => !remove(key)))
    const points = Object.fromEntries(Object.entries(coordinates).filter(([key]) => !remove(key.split(':')[1])))
    commitEditor(next, points)
    setSelected(Object.keys(next).find(key => key.startsWith(`${group}/`)) ?? Object.keys(next)[0])
  }
  function revert(path: string, mode: Theme) {
    if (snapshot.palette[path]) edit(path, mode, snapshot.palette[path][mode], false)
    else removeAddition(path)
  }
  function reset() {
    if (recovery && !window.confirm('Discard the saved draft that could not be restored? Download it first if you need it.')) return
    endEdit()
    commitEditor(createDraft(snapshot), {})
    setRecovery('')
    setNotice('All changes reset in both themes. Undo restores the draft.')
    setStorageAvailable(true)
  }
  async function loadFile(file?: File) {
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('The changes file is too large (maximum 1 MB).')
      const data = JSON.parse(await file.text())
      const input = (data?.format === 'stylos-figma-colors' ? draftFromFigmaBundle(snapshot, data) : data) as ChangeSet
      const next = importChanges(snapshot, input)
      const points = input.coordinates ?? {}
      validateProjections(next, points)
      if (recovery && !window.confirm('Replace the saved draft that could not be restored?')) return
      endEdit()
      commitEditor(next, points)
      setRecovery('')
      setStorageAvailable(true)
      setNotice('Draft opened. Undo restores the previous draft.')
    } catch (error) { setNotice((error as Error).message) }
  }
  function jump(role: Role) {
    const target = role.ref[theme] ?? role.ref.default
    setSelected(target.slice('palette/'.length))
    setView('Palette')
  }

  return <div className="app-shell">
    <header className="app-header">
      <div className="wordmark">stylos<span className="wordmark-divider" /> <span>Colors</span></div>
      <h1 className="header-title">The system, in color.</h1>
      <div className="header-actions">
        <button onClick={() => inputRef.current?.click()} title="Open a Stylos draft or complete color transfer from JSON">Open JSON…</button>
        <input ref={inputRef} hidden type="file" accept=".json,application/json" onChange={event => { void loadFile(event.target.files?.[0]); event.target.value = '' }} />
        <button title="Download standard DTCG JSON for Figma’s built-in variable import" onClick={() => setExporting(true)}>Export for Figma…</button>
        <button className="primary" disabled={!editedCount} onClick={() => download('stylos-colors.draft.json', JSON.stringify(patch, null, 2) + '\n')}>Save draft <span className="count">{editedCount}</span></button>
      </div>
    </header>

    {exporting && <FigmaExport snapshot={snapshot} palette={draft} coordinates={coordinates} download={download} onClose={() => setExporting(false)} />}
    <ServerWorkspace draft={patch} onNotice={setNotice} onPublished={input => {
      const patch = draftFromFigmaBundle(snapshot, input)
      const next = importChanges(snapshot, patch)
      if (recovery && !window.confirm('Replace the saved draft that could not be restored?')) return
      endEdit(); commitEditor(next, patch.coordinates ?? {}); setRecovery(''); setStorageAvailable(true)
    }} onOpen={input => {
      const next = importChanges(snapshot, input)
      validateProjections(next, input.coordinates ?? {})
      if (recovery && !window.confirm('Replace the saved draft that could not be restored?')) return
      endEdit(); commitEditor(next, input.coordinates ?? {}); setRecovery(''); setStorageAvailable(true)
    }} />

    <main>
      <div className="workspace-toolbar">
        <nav className="view-nav" aria-label="Color views">{(['Palette', 'Semantic', 'Special', 'Changes'] as View[]).map(item => <button key={item} aria-label={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}{item === 'Changes' && editedCount > 0 && <span className="small-count">{editedCount}</span>}</button>)}</nav>
        <div className="editing-toolbar">
          <div className="history-controls" role="group" aria-label="Edit history"><button disabled={!history.past.length} onClick={undo} aria-label="Undo" title="Undo · Ctrl/Cmd+Z">↶ Undo</button><button disabled={!history.future.length} onClick={redo} aria-label="Redo" title="Redo · Ctrl/Cmd+Shift+Z or Ctrl+Y">↷ Redo</button></div>
          <button className="grayscale-toggle" aria-pressed={grayscale} onClick={toggleGrayscale} title={`Preview lightness in ${space.toUpperCase()} without chroma. Hold B for a temporary preview.`}><span className="grayscale-icon" aria-hidden="true" />Grayscale <kbd aria-hidden="true">B</kbd></button>
          <div className="mode-switch" role="group" aria-label="Palette theme">{MODES.map(mode => <button key={mode} aria-pressed={theme === mode} onClick={() => setTheme(mode)}>{mode === 'light' ? '☀ Light' : '☾ Dark'}</button>)}</div>
          <button className="reset-changes" disabled={!editedCount && !recovery} title="Reset all changes in both themes. This can be undone." onClick={reset}>Reset changes</button>
        </div>
      </div>

      {notice && <div className="notice" role="status"><span>{notice}</span>{recovery && <button onClick={() => download('stylos-colors.saved-draft.json', recovery)}>Download saved draft</button>}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

      {view === 'Palette' && <div className="palette-workspace">
        <section className="palette-panel" aria-label={`${theme} palette`}>
          <div className="panel-heading"><h2>Palette <span>{theme}</span></h2><div className="palette-actions"><button onClick={() => { setAdding('row'); setNewName('') }}>+ Add row</button><button onClick={() => { setAdding('step'); setNewName('') }}>+ Add step</button></div></div>
          {adding && <form className="add-form" aria-label={adding === 'row' ? 'Add hue row' : 'Add palette step'} onSubmit={event => { event.preventDefault(); add() }}><label>{adding === 'row' ? 'Hue name' : 'Step number'}<input autoFocus aria-label={adding === 'row' ? 'New hue name' : 'New step number'} value={newName} placeholder={adding === 'row' ? 'e.g. brand' : 'e.g. 750'} onChange={event => setNewName(event.target.value)} /></label><button className="primary" type="submit">{adding === 'row' ? 'Add row' : 'Add step'}</button><button type="button" onClick={() => setAdding(null)}>Cancel</button></form>}
          <div className="palette-rows">{hues.map(group => {
            const paths = pathsForHue(draft, group)
            return <div className={`ramp-row ${group === hue ? 'selected-ramp' : ''}`} key={group}>
              <span className="ramp-name">{group}</span>
              <div className="ramp-swatches">{paths.map(path => {
                const value = draft[path][theme]
                const preview = previewColor(value, path)
                const changed = value !== snapshot.palette[path]?.[theme] || Boolean(coordinates[coordinateKey(path, theme)])
                const outsideGamut = outsideSrgb(coordinates, path, theme)
                return <button className={`swatch ${selected === path ? 'selected' : ''} ${outsideGamut ? 'out-of-gamut' : ''}`} key={path} style={{ backgroundColor: preview, color: wcagContrast(preview, '#ffffff') > wcagContrast(preview, '#000000') ? '#ffffff' : '#000000' }} aria-label={`${path}, ${value}${changed ? ', changed' : ''}${outsideGamut ? ', outside sRGB' : ''}`} aria-pressed={selected === path} title={`${path} · ${value}${outsideGamut ? " · Outside sRGB — showing mapped preview" : ""}`} onClick={() => setSelected(path)}><span>{path.split('/')[1]}</span>{outsideGamut && <strong aria-hidden="true">!</strong>}{changed && <i aria-hidden="true" />}</button>
              })}</div>
            </div>
          })}</div>
          <div className="panel-note"><span className="changed-dot" /> Edited value <span>{grayscale ? `Grayscale preview · ${space.toUpperCase()} lightness` : 'Light and dark ramps are independent.'}</span></div>
        </section>

        <aside className="inspector" aria-label="Selected palette token">
          <div className="graph-heading"><label>Color space <select value={space} onChange={event => setSpace(event.target.value as spaceName)}><option value="oklch">OKLCH</option><option value="cielch">CIELCH</option></select></label><label className="checkbox-label"><input type="checkbox" checked={showColors} onChange={event => setShowColors(event.target.checked)} /> Color gamut</label></div>
          <div className="panel-heading"><h2>{selected}</h2><span className="eyebrow">{theme}</span></div>
          <div className="color-comparison">
            <div style={{ background: previewColor(snapshot.palette[selected]?.[theme] ?? "var(--bg-sunken)") }}><span>Source</span><code>{snapshot.palette[selected]?.[theme] ?? "New token"}</code></div>
            <div style={{ background: previewColor(draft[selected][theme], selected) }}><span>Draft</span><code>{draft[selected][theme]}</code></div>
          </div>
          <div className="hex-row"><HexEditor key={`${selected}:${theme}`} onEditStart={beginEdit} onEditEnd={endEdit} value={draft[selected][theme]} onChange={value => edit(selected, theme, value)} /><button disabled={!isNew && draft[selected][theme] === snapshot.palette[selected][theme] && !coordinates[coordinateKey(selected, theme)]} onClick={() => revert(selected, theme)}>{isNew ? isNewHue ? "Remove new row" : "Remove new step" : "Revert token"}</button></div>
          <div className="gamut-actions"><span className={outside.length ? 'gamut-warning' : 'muted'} role="status">{outside.length ? `${outside.length} color${outside.length === 1 ? '' : 's'} outside sRGB` : 'All colors are displayable in sRGB'}</span><button disabled={!outside.length} onClick={makeDisplayable}>Make colors displayable</button></div>
          {outside.includes(selected) && <p className="gamut-explanation">This color is outside sRGB. The swatch shows a mapped preview; the graph keeps your original LCH values.</p>}

          <div className="bulk-actions"><button disabled={hue === "mono"} onClick={() => applyChannel("h")}>Apply hue to row</button><button disabled={hue === "mono"} onClick={() => applyChannel("l")}>Apply lightness to step</button></div>
          <div className="graphs">{(['l', 'c', 'h'] as Channel[]).map(channel => <section key={channel} className="graph-section" aria-label={`${CHANNEL_NAMES[channel]} graph for ${hue}`}><h3>{CHANNEL_NAMES[channel]} <span>{channel.toUpperCase()}</span></h3><Scale width={Math.max(572, rampPaths.length * 44)} height={160} channel={channel} colors={colors} selected={selectedIndex} onSelect={index => setSelected(rampPaths[index])} onColorChange={editLch} onEditStart={beginEdit} onEditEnd={endEdit} /></section>)}</div>
          <div className="dependencies"><h3>Used by {dependent.length} roles</h3>{dependent.length ? dependent.map(role => <div key={role.path}><span className="role-dot" style={{ background: rolePreviewCss(resolveRole(project, draft, role.path, theme), previewColor) }} /><code>{role.path}</code>{role.generated && <span className="tag">special</span>}</div>) : <p className="muted">No semantic role currently references this step in {theme} mode.</p>}</div>
        </aside>
      </div>}

      {(view === 'Semantic' || view === 'Special') && <section className="roles-panel">
        <div className="roles-toolbar">
          <label className="search-label">Find a role<input type="search" value={filter} placeholder="Filter by role, hue or state…" onChange={event => setFilter(event.target.value)} /></label>
          <div className="presentation-switch" role="group" aria-label="Role presentation"><button aria-pressed={presentation === 'context'} onClick={() => setPresentation('context')}>In context</button><button aria-pressed={presentation === 'swatches'} onClick={() => setPresentation('swatches')}>Swatches</button></div>
          <label>Preview background<select value={backgroundPath} onChange={event => setComparePath(event.target.value)}>{project.roles.filter(role => role.path.startsWith('background/')).map(role => <option key={role.path}>{role.path}</option>)}</select></label>
        </div>
        {groupedRoles.map(area => <details className="role-area" key={area.area} open>
          <summary><h2>{roleLabel(area.area)} <span>{area.sections.reduce((total, section) => total + section.families.reduce((count, family) => count + family.roles.length, 0), 0)}</span></h2></summary>
          {area.sections.map(section => <section className="role-section" key={section.name} aria-label={`${roleLabel(area.area)}${section.name ? ` / ${roleLabel(section.name)}` : ''}`}>
            {section.name && <h3>{roleLabel(section.name)}</h3>}
            {area.area === 'surface' && <div className="state-headings" aria-hidden="true"><span />{ROLE_STATES.map(state => <span key={state}>{roleLabel(state)}</span>)}</div>}
            {section.families.map(family => <div key={family.name} className={area.area === 'surface' ? 'role-family' : 'role-grid'} role="group" aria-label={[area.area, section.name, family.name].filter(Boolean).map(roleLabel).join(' / ')}>
              {family.name && <h4>{roleLabel(family.name)}</h4>}
              {family.roles.map(role => <RoleCard key={role.path} role={role} snapshot={project} draft={draft} theme={theme} comparePath={backgroundPath} presentation={presentation} previewColor={previewColor} onSelect={() => jump(role)} />)}
            </div>)}
          </section>)}
        </details>)}
        {!groupedRoles.length && <p className="empty-state">No roles match “{filter}”.</p>}
      </section>}

      {view === 'Changes' && <section className="changes-panel"><div className="panel-heading"><h2>Draft changes</h2><button disabled={!editedCount && !recovery} onClick={reset}>Reset draft</button></div>{editedCount ? <div className="changes-scroll"><table><thead><tr><th>Token</th><th>Theme</th><th>Source</th><th>Draft</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{patch.changes.map(change => <tr key={`${change.path}:${change.mode}`}><td><code>{change.path}</code></td><td>{change.mode}</td><td><span className="role-dot" style={{ background: previewColor(change.before ?? "transparent") }} />{change.before ?? "New token"}</td><td><span className="role-dot" style={{ background: previewColor(change.after) }} />{change.after}</td><td><button onClick={() => revert(change.path.slice('palette/'.length), change.mode)}>Revert</button></td></tr>)}</tbody></table></div> : <div className="empty-state"><h3>The source palette is unchanged.</h3><p>Edit a swatch or move a point on a graph to start a draft.</p></div>}<p className="section-note">{Object.keys(coordinates).length > 0 && `${Object.keys(coordinates).length} LCH graph points are preserved in this draft. `}Save draft keeps original values and collects edits from both themes. Canonical tokens are updated separately.</p><details className="export-data"><summary>Draft file (JSON)</summary><textarea readOnly aria-label="Changes JSON" value={JSON.stringify(patch, null, 2)} onFocus={event => event.currentTarget.select()} /></details></section>}
    </main>

    <footer className="app-footer"><span>{editedCount ? `${editedCount} edited values · ` : ''}{storageAvailable ? 'Draft saved in this browser' : 'Save a file to keep your draft'}</span><span className="footer-credit">Color engine & graphs adapted from <a href="https://github.com/ardov/huetone" target="_blank" rel="noreferrer">Huetone ↗</a> · <a href="./LICENSE.huetone.txt">MIT</a></span></footer>
  </div>
}

function HexEditor({ value, onChange, onEditStart, onEditEnd }: { value: string; onChange: (value: string) => void; onEditStart: () => void; onEditEnd: () => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const invalid = !HEX.test(text)
  return <label className="hex-editor"><span className="sr-only">Selected color HEX</span><input type="color" value={value} aria-label="Pick selected color" onFocus={onEditStart} onBlur={onEditEnd} onChange={event => { onEditStart(); onChange(event.target.value) }} /><input value={text} aria-label="Selected color HEX" aria-invalid={invalid} maxLength={7} spellCheck={false} onFocus={onEditStart} onChange={event => { onEditStart(); setText(event.target.value); if (HEX.test(event.target.value)) onChange(event.target.value) }} onBlur={() => { setText(value); onEditEnd() }} onKeyDown={event => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur() }} /></label>
}

function RoleCard({ role, snapshot, draft, theme, comparePath, presentation, previewColor, onSelect }: {
  role: Role; snapshot: Snapshot; draft: Palette; theme: Theme; comparePath: string; presentation: 'context' | 'swatches'; previewColor: PreviewColor; onSelect: () => void
}) {
  const color = resolveRole(snapshot, draft, role.path, theme)
  const bg = resolveRole(snapshot, draft, comparePath, theme)
  const area = role.path.split('/')[0]
  const sampleCss = (resolved: ReturnType<typeof resolveRole>) => rolePreviewCss(resolved, previewColor)
  const css = (path: string) => sampleCss(resolveRole(snapshot, draft, path, theme))
  const surface = area === 'surface'
  const style = {
    '--preview': sampleCss(color),
    '--preview-bg': sampleCss(bg),
    '--sample-fill': css('surface/subtle/base/default'),
    '--sample-ink': css(surface && role.path.endsWith('/disabled') ? 'text/disabled' : surface && role.path.startsWith('surface/bold/') ? 'text/inverted' : 'text/base'),
    gridColumn: surface ? ROLE_STATES.indexOf(role.path.split('/').at(-1)!) + 2 : undefined,
  } as CSSProperties
  const source = snapshot.palette[color.ref.slice('palette/'.length)]?.[theme]
  const changed = !source || color.value !== source
  const ratio = area === 'text' && color.alpha === 1 && bg.alpha === 1 ? wcagContrast(color.value, bg.value) : null
  return <button className={`role-card ${changed ? 'changed' : ''}`} style={style} onClick={onSelect} title={`Edit ${color.ref} · ${role.path}`}>
    <div aria-hidden="true" className={`role-preview ${presentation === 'swatches' ? 'swatch-preview' : `${area}-preview`}`}>
      {presentation === 'context' && (area === 'text'
        ? <span className="sample-text">Aa <small>The quick brown fox</small></span>
        : <span className="sample-tile">{surface ? 'Button' : 'Aa'}</span>)}
    </div>
    <div className="role-card-info"><code>{role.path}</code><span>{color.ref}{color.alpha !== 1 ? ` · ${Math.round(color.alpha * 100)}%` : ''}</span><div><span className="role-dot" style={{ background: sampleCss(color) }} /><span>{color.value}</span>{ratio !== null && <span className="contrast-ratio" title={`WCAG contrast against ${comparePath}; a ratio alone does not assess a component`}>{ratio.toFixed(2)}:1</span>}{changed && <span className="tag">edited</span>}</div></div>
  </button>
}
