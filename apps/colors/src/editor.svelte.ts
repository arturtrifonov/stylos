// One editing session: the draft, its history and what the screen is showing.
import { colorSpaces } from './huetone/shared/colorFuncs'
import { spaceName } from './huetone/shared/types'
import type { LCH } from './huetone/shared/types'
import { MODES, addHue, addStep, assignRole, assignScale, colorCss, createDraft, exportChanges, importAssignments, importChanges, noAssignments, rampPaths, resolveRole, scaleRef, withDraftRoles } from './model.mjs'
import type { Assignments, ChangeSet, Coordinates, Palette, Role, Snapshot, Theme } from './model.mjs'
import { coordinateKey, editorColor, interpolatedStep, outsideSrgb, validateProjections } from './editing'
import { draftFromFigmaBundle } from './figma-bundle.mjs'
import { createHistory, recordHistory, redoHistory, undoHistory } from './history.mjs'
import { groupRoles } from './role-groups.mjs'

const STORAGE = 'stylos.colors.draft.v1'
export const HEX = /^#[0-9a-f]{6}$/i
export const PALETTE = 'palette/'
export type View = 'Palette' | 'Semantic' | 'Special' | 'Changes'
type State = { palette: Palette; coordinates: Coordinates; assignments: Assignments }

function opened(snapshot: Snapshot, input: ChangeSet): State {
  const palette = importChanges(snapshot, input)
  const coordinates = input.coordinates ?? {}
  validateProjections(palette, coordinates)
  return { palette, coordinates, assignments: importAssignments(snapshot, input, palette) }
}

function restore(snapshot: Snapshot) {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE)
    const input = saved ? JSON.parse(saved) as ChangeSet : null
    const state = input ? opened(snapshot, input) : { palette: createDraft(snapshot), coordinates: {}, assignments: noAssignments() }
    return { state, problem: '', recovery: '' }
  } catch (error) {
    return { state: { palette: createDraft(snapshot), coordinates: {}, assignments: noAssignments() }, problem: `Saved draft: ${(error as Error).message}`, recovery: saved ?? '' }
  }
}

export function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 1000)
}

export class Editor {
  readonly snapshot: Snapshot
  history
  theme = $state<Theme>('light')
  view = $state<View>('Palette')
  space = $state(spaceName.oklch)
  showColors = $state(true)
  grayscalePinned = $state(false)
  grayscaleHeld = $state(false)
  notice = $state('')
  recovery = $state('')
  storageAvailable = $state(true)
  selection = $state('')
  selectedRolePath = $state('')
  private editGroup: string | null = null
  private editSequence = 0

  constructor(snapshot: Snapshot) {
    this.snapshot = snapshot
    const initial = restore(snapshot)
    this.history = $state.raw(createHistory(initial.state, { palette: createDraft(snapshot), coordinates: {}, assignments: noAssignments() }))
    this.notice = initial.problem
    this.recovery = initial.recovery
    this.storageAvailable = !initial.problem
    this.selection = 'indigo/700' in snapshot.palette ? 'indigo/700' : Object.keys(snapshot.palette)[0]
    this.selectedRolePath = snapshot.roles.find(role => !role.generated)?.path ?? ''
  }

  palette = $derived.by(() => this.history.present.palette)
  coordinates = $derived.by(() => this.history.present.coordinates)
  assignments = $derived.by(() => this.history.present.assignments)
  patch = $derived.by(() => exportChanges(this.snapshot, this.palette, this.coordinates, this.assignments))
  project = $derived.by(() => withDraftRoles(this.snapshot, this.palette, this.assignments))
  hues = $derived([...new Set(Object.keys(this.palette).map(path => path.split('/')[0]))])
  editedCount = $derived(new Set([...this.patch.changes.map(change => coordinateKey(change.path.slice(PALETTE.length), change.mode)), ...Object.keys(this.coordinates)]).size +
    (this.patch.roles?.length ?? 0) + (this.patch.scale?.length ?? 0))
  outside = $derived(Object.keys(this.palette).filter(path => outsideSrgb(this.coordinates, path, this.theme)))
  selected = $derived(this.palette[this.selection] ? this.selection : Object.keys(this.palette)[0])
  hue = $derived(this.selected.split('/')[0])
  ramp = $derived(rampPaths(this.palette, this.hue))
  colors = $derived(this.ramp.map(path => editorColor(this.palette, this.coordinates, path, this.theme, this.space)))
  grayscale = $derived(this.grayscalePinned || this.grayscaleHeld)
  private grayPalette = $derived(this.grayscale ? Object.fromEntries(Object.keys(this.palette).map(path => [path,
    colorSpaces[this.space].lch2color([editorColor(this.palette, this.coordinates, path, this.theme, this.space).l, 0, 0]).hex,
  ])) : null)

  /** Grayscale changes only what is shown, never a token value. */
  previewColor = (value: string, path?: string) => {
    if (!this.grayscale) return value
    if (path && this.grayPalette?.[path]) return this.grayPalette[path]
    const color = HEX.test(value) ? colorSpaces[this.space].hex2color(value) : null
    return color ? colorSpaces[this.space].lch2color([color.l, 0, 0]).hex : value
  }
  roleCss = (path: string, mode: Theme = this.theme) => {
    const color = resolveRole(this.project, this.palette, path, mode)
    return colorCss({ ...color, value: this.previewColor(color.value, color.ref.slice(PALETTE.length)) })
  }
  roleBinding = (role: Role, mode: Theme) => role.ref[mode] ?? role.ref.default
  roleEdited = (path: string) => Boolean(this.assignments.roles[path])
  groupedRoles = (special: boolean, filter: string) => groupRoles(this.project.roles, special, filter)

  beginEdit = () => { this.editGroup ??= `edit-${++this.editSequence}` }
  endEdit = () => { this.editGroup = null }
  private commit(next: Partial<State>, merge = false) {
    const state = { ...this.history.present, ...next }
    try {
      exportChanges(this.snapshot, state.palette, state.coordinates, state.assignments)
      this.history = recordHistory(this.history, state, merge ? this.editGroup : null)
    } catch (error) { this.notice = (error as Error).message }
  }
  undo = () => { this.endEdit(); this.history = undoHistory(this.history); this.notice = '' }
  redo = () => { this.endEdit(); this.history = redoHistory(this.history); this.notice = '' }

  edit = (path: string, mode: Theme, value: string, merge = true) => {
    const coordinates = { ...this.coordinates }
    delete coordinates[coordinateKey(path, mode)]
    this.commit({ palette: { ...this.palette, [path]: { ...this.palette[path], [mode]: value.toLowerCase() } }, coordinates }, merge)
  }
  editLch = (index: number, lch: LCH) => {
    const path = this.ramp[index]
    this.selection = path
    this.commit({
      palette: { ...this.palette, [path]: { ...this.palette[path], [this.theme]: colorSpaces[this.space].lch2color(lch).hex } },
      coordinates: { ...this.coordinates, [coordinateKey(path, this.theme)]: { space: this.space, lch } },
    }, true)
  }
  makeDisplayable = () => {
    const count = this.outside.length
    this.commit({ coordinates: Object.fromEntries(Object.entries(this.coordinates).filter(([key]) => {
      const [mode, path] = key.split(':')
      return mode !== this.theme || !this.outside.includes(path)
    })) })
    this.notice = `Made ${count} color${count === 1 ? '' : 's'} displayable in ${this.theme} mode.`
  }
  applyChannel = (channel: 'h' | 'l') => {
    const { space, theme, palette, coordinates, selected } = this
    const selectedColor = editorColor(palette, coordinates, selected, theme, space)
    const targets = channel === 'h' ? this.ramp : Object.keys(palette).filter(path => path.split('/')[1] === selected.split('/')[1])
    const next = structuredClone(palette)
    const points = { ...coordinates }
    for (const path of targets) {
      const color = editorColor(palette, coordinates, path, theme, space)
      const lch: LCH = [channel === 'l' ? selectedColor.l : color.l, color.c, channel === 'h' ? selectedColor.h : color.h]
      points[coordinateKey(path, theme)] = { space, lch }
      next[path][theme] = colorSpaces[space].lch2color(lch).hex
    }
    this.commit({ palette: next, coordinates: points })
  }
  addRow = (name: string) => {
    const fromHue = this.hue === 'mono' ? this.hues.find(group => group !== 'mono')! : this.hue
    const palette = addHue(this.palette, name, fromHue)
    const extra: Coordinates = {}
    for (const path of rampPaths(this.palette, fromHue)) for (const mode of MODES) {
      const point = this.coordinates[coordinateKey(path, mode)]
      if (point) extra[coordinateKey(`${name}/${path.split('/')[1]}`, mode)] = structuredClone(point)
    }
    const first = `${name}/${rampPaths(this.palette, fromHue)[0].split('/')[1]}`
    this.commit({ palette, coordinates: { ...this.coordinates, ...extra } })
    this.selection = first
  }
  addColumn = (step: string) => {
    const { palette, coordinates, space } = this
    const hue = this.hue === 'mono' ? this.hues.find(group => group !== 'mono') : this.hue
    this.commit({ palette: addStep(palette, step, (group: string, mode: Theme) => interpolatedStep(palette, coordinates, group, step, mode, space)) })
    this.selection = `${hue}/${step}`
  }
  removeAddition = (path: string) => {
    const [group, step] = path.split('/')
    const newGroup = !Object.keys(this.snapshot.palette).some(key => key.startsWith(`${group}/`))
    const remove = (key: string) => newGroup ? key.startsWith(`${group}/`) : key.split('/')[1] === step
    const bound = [...Object.values(this.assignments.roles), ...Object.values(this.assignments.scale)].flatMap(modes => Object.values(modes) as string[])
    if (bound.some(ref => remove(ref.slice(PALETTE.length)))) {
      this.notice = `A reassigned role uses this ${newGroup ? 'row' : 'step'}. Assign the role elsewhere first.`
      return
    }
    const palette = Object.fromEntries(Object.entries(this.palette).filter(([key]) => !remove(key)))
    this.commit({ palette, coordinates: Object.fromEntries(Object.entries(this.coordinates).filter(([key]) => !remove(key.split(':')[1]))) })
    this.selection = Object.keys(palette).find(key => key.startsWith(`${group}/`)) ?? Object.keys(palette)[0]
  }
  revert = (path: string, mode: Theme) => {
    if (this.snapshot.palette[path]) this.edit(path, mode, this.snapshot.palette[path][mode], false)
    else this.removeAddition(path)
  }

  assignRole = (path: string, mode: Theme, ref: string) => {
    this.commit({ assignments: assignRole(this.snapshot, this.assignments, path, mode, ref) })
  }
  revertRole = (path: string, mode?: Theme) => {
    const source = this.snapshot.roles.find(role => role.path === path)!
    let assignments = this.assignments
    for (const each of mode ? [mode] : MODES) assignments = assignRole(this.snapshot, assignments, path, each, this.roleBinding(source, each))
    this.commit({ assignments })
  }
  scaleRef = (template: string, mode: Theme) => scaleRef(this.snapshot, this.assignments, template, mode)
  assignScale = (template: string, mode: Theme, ref: string) => {
    this.commit({ assignments: assignScale(this.snapshot, this.assignments, template, mode, ref) })
  }
  revertScale = (template: string, mode?: Theme) => {
    let assignments = this.assignments
    for (const each of mode ? [mode] : MODES) assignments = assignScale(this.snapshot, assignments, template, each, scaleRef(this.snapshot, noAssignments(), template, each))
    this.commit({ assignments })
  }

  reset = () => {
    if (this.recovery && !window.confirm('Discard the saved draft that could not be restored? Download it first if you need it.')) return
    this.endEdit()
    this.commit({ palette: createDraft(this.snapshot), coordinates: {}, assignments: noAssignments() })
    this.recovery = ''
    this.notice = 'All changes reset in both themes. Undo restores the draft.'
    this.storageAvailable = true
  }
  private replace(state: State) {
    if (this.recovery && !window.confirm('Replace the saved draft that could not be restored?')) return false
    this.endEdit()
    this.commit(state)
    this.recovery = ''
    this.storageAvailable = true
    return true
  }
  openDraft = (input: ChangeSet) => this.replace(opened(this.snapshot, input))
  openBundle = (input: unknown) => this.replace(opened(this.snapshot, draftFromFigmaBundle(this.snapshot, input)))
  loadFile = async (file?: File) => {
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('The changes file is too large (maximum 1 MB).')
      const data = JSON.parse(await file.text())
      const done = data?.format === 'stylos-figma-colors' ? this.openBundle(data) : this.openDraft(data)
      if (done) this.notice = 'Draft opened. Undo restores the previous draft.'
    } catch (error) { this.notice = (error as Error).message }
  }
  /** Never replace an unreadable or stale saved draft on startup. */
  persist() {
    if (!this.storageAvailable) return
    try {
      if (this.editedCount) localStorage.setItem(STORAGE, JSON.stringify(this.patch))
      else localStorage.removeItem(STORAGE)
    } catch {
      this.storageAvailable = false
      this.notice = 'Browser storage is unavailable. Save a draft file to keep your changes.'
    }
  }
  openStep = (ref: string) => {
    this.selection = ref.slice(PALETTE.length)
    this.view = 'Palette'
  }
}
