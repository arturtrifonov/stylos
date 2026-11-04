<script lang="ts">
  import { Button, Tag } from '@stylos/ui'
  import { wcagContrast } from './huetone/shared/color'
  import { MODES, resolveRole } from './model.mjs'
  import type { Role } from './model.mjs'
  import StepPicker from './StepPicker.svelte'
  import { PALETTE } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor, role, comparePath }: { editor: Editor; role: Role; comparePath: string } = $props()
  const edited = $derived(editor.roleEdited(role.path))
  const isText = $derived(role.path.startsWith('text/'))

  function contrast(mode: 'light' | 'dark') {
    const color = resolveRole(editor.project, editor.palette, role.path, mode)
    const ground = resolveRole(editor.project, editor.palette, comparePath, mode)
    return isText && color.alpha === 1 && ground.alpha === 1 ? wcagContrast(color.value, ground.value) : null
  }
</script>

<aside class="inspector role-inspector" aria-label="Selected role">
  <div class="panel-heading">
    <h2 class="stylos-heading-h6"><code>{role.path}</code></h2>
    {#if edited}<Tag size="extra small" tone="primary" textCase="original" labelText="reassigned" />{/if}
  </div>
  {#each MODES as mode (mode)}
    {@const ref = editor.roleBinding(role, mode)}
    {@const color = resolveRole(editor.project, editor.palette, role.path, mode)}
    {@const ratio = contrast(mode)}
    <section class="binding" aria-label={`${mode} binding`}>
      <div class="binding-heading">
        <h3>{mode === 'light' ? 'Light' : 'Dark'}</h3>
        <span class="binding-value"><span class="role-dot" style:background={editor.previewColor(color.value, ref.slice(PALETTE.length))}></span>{ref.slice(PALETTE.length)} · {color.value}{color.alpha !== 1 ? ` · ${Math.round(color.alpha * 100)}%` : ''}</span>
        {#if ratio !== null}<span class="contrast-ratio" title={`WCAG contrast against ${comparePath}; a ratio alone does not assess a component`}>{ratio.toFixed(2)}:1</span>{/if}
      </div>
      <StepPicker {editor} theme={mode} value={ref} label={`${role.path} ${mode}`} onChange={next => editor.assignRole(role.path, mode, next)} />
    </section>
  {/each}
  <div class="binding-actions">
    <Button variant="outline" tone="base" size="small" labelText="Open step in palette" onclick={() => editor.openStep(editor.roleBinding(role, editor.theme))} />
    <Button variant="outline" tone="base" size="small" labelText="Revert role" state={edited ? 'default' : 'disabled'} onclick={() => editor.revertRole(role.path)} />
  </div>
</aside>
