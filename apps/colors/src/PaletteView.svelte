<script lang="ts">
  import { Button, CheckboxLabel, DropdownItemDefault, InputText, Select } from '@stylos/ui'
  import Scale from './huetone/components/ColorGraph/Scale.svelte'
  import { wcagContrast } from './huetone/shared/color'
  import type { Channel } from './huetone/shared/types'
  import { coordinateKey, outsideSrgb } from './editing'
  import { rampPaths } from './model.mjs'
  import HexEditor from './HexEditor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()
  const CHANNELS: [Channel, string][] = [['l', 'Lightness'], ['c', 'Chroma'], ['h', 'Hue']]
  let adding = $state<'row' | 'step' | null>(null)
  let newName = $state('')

  const snapshot = $derived(editor.snapshot)
  const theme = $derived(editor.theme)
  const selected = $derived(editor.selected)
  const sourceValue = $derived(snapshot.palette[selected]?.[theme])
  const isNew = $derived(!snapshot.palette[selected])
  const isNewHue = $derived(!Object.keys(snapshot.palette).some(path => path.startsWith(`${editor.hue}/`)))
  const selectedIndex = $derived(editor.ramp.indexOf(selected))
  const dependent = $derived(editor.project.roles.filter(role => editor.roleBinding(role, theme) === `palette/${selected}`))
  const unchanged = $derived(!isNew && editor.palette[selected][theme] === sourceValue && !editor.coordinates[coordinateKey(selected, theme)])

  function add(event: SubmitEvent) {
    event.preventDefault()
    try {
      if (adding === 'row') editor.addRow(newName.trim())
      else editor.addColumn(newName.trim())
      adding = null
      newName = ''
    } catch (error) { editor.notice = (error as Error).message }
  }
  const ink = (color: string) => wcagContrast(color, '#ffffff') > wcagContrast(color, '#000000') ? '#ffffff' : '#000000'
</script>

<div class="palette-workspace">
  <section class="palette-panel" aria-label={`${theme} palette`}>
    <div class="panel-heading">
      <h2 class="stylos-heading-h5">Palette <span>{theme}</span></h2>
      <div class="palette-actions">
        <Button variant="outline" tone="base" size="small" labelText="Add row" onclick={() => { adding = 'row'; newName = '' }} />
        <Button variant="outline" tone="base" size="small" labelText="Add step" onclick={() => { adding = 'step'; newName = '' }} />
      </div>
    </div>
    {#if adding}
      <form class="add-form" aria-label={adding === 'row' ? 'Add hue row' : 'Add palette step'} onsubmit={add}>
        <InputText size="small" labelText={adding === 'row' ? 'Hue name' : 'Step number'} bind:value={newName} hasPlaceholder
          placeholderText={adding === 'row' ? 'e.g. brand' : 'e.g. 750'} />
        <Button type="submit" size="small" labelText={adding === 'row' ? 'Add row' : 'Add step'} />
        <Button variant="ghost" tone="base" size="small" labelText="Cancel" onclick={() => { adding = null }} />
      </form>
    {/if}
    <div class="palette-rows">
      {#each editor.hues as group (group)}
        <div class="ramp-row" class:selected-ramp={group === editor.hue}>
          <span class="ramp-name">{group}</span>
          <div class="ramp-swatches">
            {#each rampPaths(editor.palette, group) as path (path)}
              {@const value = editor.palette[path][theme]}
              {@const preview = editor.previewColor(value, path)}
              {@const changed = value !== snapshot.palette[path]?.[theme] || Boolean(editor.coordinates[coordinateKey(path, theme)])}
              {@const outside = outsideSrgb(editor.coordinates, path, theme)}
              <button type="button" class="swatch" class:selected={selected === path} class:out-of-gamut={outside}
                style:background-color={preview} style:color={ink(preview)}
                aria-label={`${path}, ${value}${changed ? ', changed' : ''}${outside ? ', outside sRGB' : ''}`} aria-pressed={selected === path}
                title={`${path} · ${value}${outside ? ' · Outside sRGB — showing mapped preview' : ''}`} onclick={() => { editor.selection = path }}>
                <span>{path.split('/')[1]}</span>
                {#if outside}<strong aria-hidden="true">!</strong>{/if}
                {#if changed}<i aria-hidden="true"></i>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    <div class="panel-note"><span class="changed-dot"></span> Edited value <span>{editor.grayscale ? `Grayscale preview · ${editor.space.toUpperCase()} lightness` : 'Light and dark ramps are independent.'}</span></div>
  </section>

  <aside class="inspector" aria-label="Selected palette token">
    <div class="graph-heading">
      <Select size="small" hasLabel={false} accessibleName="Color space" bind:value={editor.space} inputText={editor.space.toUpperCase()}>
        <DropdownItemDefault value="oklch" labelText="OKLCH" />
        <DropdownItemDefault value="cielch" labelText="CIELCH" />
      </Select>
      <CheckboxLabel size="small" labelText="Color gamut"
        bind:isChecked={() => editor.showColors ? 'true' : 'false', checked => { editor.showColors = checked === 'true' }} />
    </div>
    <div class="panel-heading"><h2 class="stylos-heading-h5">{selected}</h2><span class="eyebrow">{theme}</span></div>
    <div class="color-comparison">
      <div style:background={editor.previewColor(sourceValue ?? 'var(--stylos-color-background-tertiary)')}><span>Source</span><code>{sourceValue ?? 'New token'}</code></div>
      <div style:background={editor.previewColor(editor.palette[selected][theme], selected)}><span>Draft</span><code>{editor.palette[selected][theme]}</code></div>
    </div>
    <div class="hex-row">
      {#key `${selected}:${theme}`}
        <HexEditor value={editor.palette[selected][theme]} onEditStart={editor.beginEdit} onEditEnd={editor.endEdit} onChange={value => editor.edit(selected, theme, value)} />
      {/key}
      <Button variant="outline" tone="base" size="small" state={unchanged ? 'disabled' : 'default'}
        labelText={isNew ? (isNewHue ? 'Remove new row' : 'Remove new step') : 'Revert token'} onclick={() => editor.revert(selected, theme)} />
    </div>
    <div class="gamut-actions">
      <span class={editor.outside.length ? 'gamut-warning' : 'muted'} role="status">{editor.outside.length ? `${editor.outside.length} color${editor.outside.length === 1 ? '' : 's'} outside sRGB` : 'All colors are displayable in sRGB'}</span>
      <Button variant="outline" tone="base" size="small" labelText="Make colors displayable" state={editor.outside.length ? 'default' : 'disabled'} onclick={editor.makeDisplayable} />
    </div>
    {#if editor.outside.includes(selected)}<p class="gamut-explanation">This color is outside sRGB. The swatch shows a mapped preview; the graph keeps your original LCH values.</p>{/if}
    <div class="bulk-actions">
      <Button variant="outline" tone="base" size="small" labelText="Apply hue to row" state={editor.hue === 'mono' ? 'disabled' : 'default'} onclick={() => editor.applyChannel('h')} />
      <Button variant="outline" tone="base" size="small" labelText="Apply lightness to step" state={editor.hue === 'mono' ? 'disabled' : 'default'} onclick={() => editor.applyChannel('l')} />
    </div>
    <div class="graphs">
      {#each CHANNELS as [channel, name] (channel)}
        <section class="graph-section" aria-label={`${name} graph for ${editor.hue}`}>
          <h3>{name} <span>{channel.toUpperCase()}</span></h3>
          <Scale width={Math.max(572, editor.ramp.length * 44)} height={160} {channel} colors={editor.colors} selected={selectedIndex}
            mode={editor.space} showColors={editor.showColors} onSelect={index => { editor.selection = editor.ramp[index] }}
            onColorChange={editor.editLch} onEditStart={editor.beginEdit} onEditEnd={editor.endEdit} />
        </section>
      {/each}
    </div>
    <div class="dependencies">
      <h3>Used by {dependent.length} roles</h3>
      {#each dependent as role (role.path)}
        <div><span class="role-dot" style:background={editor.roleCss(role.path)}></span><code>{role.path}</code>{#if role.generated}<span class="mark">special</span>{/if}</div>
      {:else}
        <p class="muted">No semantic role currently references this step in {theme} mode.</p>
      {/each}
    </div>
  </aside>
</div>
