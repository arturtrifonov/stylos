<script lang="ts">
  // Choose a palette step for one role in one theme: a hue, then a step of it.
  import { DropdownItemDefault, Select } from '@stylos/ui'
  import { wcagContrast } from './huetone/shared/color'
  import { rampPaths } from './model.mjs'
  import type { Theme } from './model.mjs'
  import { PALETTE } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor, theme, value, label, onChange }: {
    editor: Editor; theme: Theme; value: string; label: string; onChange: (ref: string) => void
  } = $props()
  const path = $derived(value.slice(PALETTE.length))
  const hue = $derived(path.split('/')[0])
  const paths = $derived(rampPaths(editor.palette, hue))

  // A new hue keeps the step where it can, so changing hue keeps the tone.
  function chooseHue(next: string) {
    const step = path.split('/')[1]
    const ramp = rampPaths(editor.palette, next)
    const nearest = [...ramp].sort((a, b) => Math.abs(Number(a.split('/')[1]) - Number(step)) - Math.abs(Number(b.split('/')[1]) - Number(step)))[0]
    onChange(`${PALETTE}${ramp.find(item => item.endsWith(`/${step}`)) ?? nearest}`)
  }
  const ink = (color: string) => wcagContrast(color, '#ffffff') > wcagContrast(color, '#000000') ? '#ffffff' : '#000000'
</script>

<div class="step-picker">
  {#key editor.hues.join()}
    <Select size="small" labelText={`${label} hue`} hasLabel={false} accessibleName={`${label} hue`}
      bind:value={() => hue, chooseHue} inputText={hue} maxHeight="280px">
      {#each editor.hues as item (item)}<DropdownItemDefault value={item} labelText={item} />{/each}
    </Select>
  {/key}
  <div class="step-swatches" role="group" aria-label={`${label} step`}>
    {#each paths as item (item)}
      {@const color = editor.palette[item][theme]}
      {@const preview = editor.previewColor(color, item)}
      <button type="button" class="swatch" class:selected={item === path} style:background-color={preview} style:color={ink(preview)}
        aria-label={`${item}, ${color}`} aria-pressed={item === path} title={`${item} · ${color}`}
        onclick={() => onChange(`${PALETTE}${item}`)}><span>{item.split('/')[1]}</span></button>
    {/each}
  </div>
</div>
