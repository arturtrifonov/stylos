<script lang="ts">
  import { wcagContrast } from './huetone/shared/color'
  import { resolveRole } from './model.mjs'
  import type { Role } from './model.mjs'
  import { ROLE_STATES } from './role-groups.mjs'
  import { PALETTE } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor, role, comparePath, swatches, selected = false, onSelect }: {
    editor: Editor; role: Role; comparePath: string; swatches: boolean; selected?: boolean; onSelect: () => void
  } = $props()
  const theme = $derived(editor.theme)
  const color = $derived(resolveRole(editor.project, editor.palette, role.path, theme))
  const ground = $derived(resolveRole(editor.project, editor.palette, comparePath, theme))
  const area = $derived(role.path.split('/')[0])
  const surface = $derived(area === 'surface')
  const sampleInk = $derived(surface && role.path.endsWith('/disabled') ? 'text/disabled' : surface && role.path.startsWith('surface/bold/') ? 'text/inverted' : 'text/base')
  const source = $derived(editor.snapshot.palette[color.ref.slice(PALETTE.length)]?.[theme])
  const changed = $derived(!source || color.value !== source)
  const original = $derived(editor.snapshot.roles.find(item => item.path === role.path))
  const rebound = $derived(!original || editor.roleBinding(original, theme) !== color.ref)
  const ratio = $derived(area === 'text' && color.alpha === 1 && ground.alpha === 1 ? wcagContrast(color.value, ground.value) : null)
</script>

<button type="button" class="role-card" class:changed={changed || rebound} class:selected aria-pressed={selected}
  style:--preview={editor.roleCss(role.path)} style:--preview-bg={editor.roleCss(comparePath)}
  style:--sample-fill={editor.roleCss('surface/subtle/base/default')} style:--sample-ink={editor.roleCss(sampleInk)}
  style:grid-column={surface ? ROLE_STATES.indexOf(role.path.split('/').at(-1)!) + 2 : undefined}
  onclick={onSelect} title={`${color.ref} · ${role.path}`}>
  <div aria-hidden="true" class="role-preview {swatches ? 'swatch-preview' : `${area}-preview`}">
    {#if !swatches}
      {#if area === 'text'}<span class="sample-text">Aa <small>The quick brown fox</small></span>
      {:else}<span class="sample-tile">{surface ? 'Button' : 'Aa'}</span>{/if}
    {/if}
  </div>
  <div class="role-card-info">
    <code>{role.path}</code>
    <span>{color.ref}{color.alpha !== 1 ? ` · ${Math.round(color.alpha * 100)}%` : ''}</span>
    <div>
      <span class="role-dot" style:background={editor.roleCss(role.path)}></span><span>{color.value}</span>
      {#if ratio !== null}<span class="contrast-ratio" title={`WCAG contrast against ${comparePath}; a ratio alone does not assess a component`}>{ratio.toFixed(2)}:1</span>{/if}
      {#if rebound}<span class="mark">reassigned</span>{:else if changed}<span class="mark">edited</span>{/if}
    </div>
  </div>
</button>
