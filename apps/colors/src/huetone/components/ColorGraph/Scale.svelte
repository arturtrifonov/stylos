<script lang="ts">
  // Huetone's scale: numeric inputs over a gamut canvas with one handle per colour.
  import { getMostContrast } from 'shared/color'
  import { colorSpaces } from 'shared/colorFuncs'
  import type { Channel, LCH, TColor } from 'shared/types'
  import type { spaceName } from 'shared/types'
  import { clamp } from 'shared/utils'
  import Canvas from './Chart/Canvas.svelte'

  let { colors, selected, channel = 'l', height = 150, width = 400, mode, showColors, onSelect, onColorChange, onEditStart, onEditEnd }: {
    colors: TColor[]; selected: number; channel?: Channel; height?: number; width?: number; mode: spaceName; showColors: boolean
    onSelect: (index: number) => void; onColorChange: (index: number, lch: LCH) => void
    onEditStart?: () => void; onEditEnd?: () => void
  } = $props()
  const range = $derived(colorSpaces[mode].ranges[channel])
  const sectionWidth = $derived(width / colors.length)

  function setColor(color: TColor, index: number, input: string) {
    onEditStart?.()
    const value = clamp(Number(input), range.min, range.max)
    if (input === '' || !Number.isFinite(value)) return
    const { l, c, h } = color
    if (channel === 'l') onColorChange(index, [value, c, h])
    if (channel === 'c') onColorChange(index, [l, value, h])
    if (channel === 'h') onColorChange(index, [l, c, value])
  }
  function pressValue(event: MouseEvent, index: number) {
    if (index === selected || event.ctrlKey) return
    event.preventDefault()
    onSelect(index)
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
  }
  function focusValue(event: FocusEvent, index: number) {
    const input = event.currentTarget as HTMLInputElement
    onEditStart?.()
    onSelect(index)
    setTimeout(() => input.select(), 0)
  }
</script>

{#if colors.length}
  <div class="scale" style:width="{width}px">
    <div class="values">
      {#each colors as color, index (index)}
        <input class="value" type="number" aria-label="{channel.toUpperCase()} value, color {index + 1}"
          style:background-color={color.hex} style:--contrasting={getMostContrast(color.hex, ['black', 'white'])}
          title={color[channel].toFixed(range.precision)} min={range.min} max={range.max} step={range.step}
          value={+color[channel].toFixed(range.precision)}
          onmousedown={event => pressValue(event, index)}
          onkeydown={event => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur() }}
          onfocus={event => focusValue(event, index)} onblur={onEditEnd}
          oninput={event => setColor(color, index, event.currentTarget.value)} />
      {/each}
    </div>
    <div class="chart">
      <Canvas {width} {height} {channel} {colors} {mode} {showColors} />
      {#each colors as color, index (index)}
        {@const contrast = getMostContrast(color.hex, ['#fff', '#000'])}
        <input class="knob" class:selected={index === selected} type="range" aria-label="{channel.toUpperCase()} slider, color {index + 1}"
          min={range.min} max={range.max} step={range.step} value={color[channel]}
          style:--contrast={contrast} style:--knob={showColors ? contrast : color.hex}
          style:--canvas-height="{height}px" style:width="{height + 16}px" style:left="{sectionWidth * index + sectionWidth / 2}px"
          onpointerdown={onEditStart} onkeydown={onEditStart} onkeyup={onEditEnd} onblur={onEditEnd}
          oninput={event => setColor(color, index, event.currentTarget.value)} onclick={() => onSelect(index)} />
      {/each}
    </div>
  </div>
{/if}

<style>
  .scale { display: flex; flex-direction: column; }
  .values { display: flex; overflow: hidden; border-radius: var(--stylos-radius-large) var(--stylos-radius-large) 0 0; }
  .value {
    flex: 1 0; min-width: 0; padding: 0; border: var(--stylos-border-width-thick) solid transparent; color: var(--contrasting);
    font-family: var(--stylos-font-family-code); font-size: var(--stylos-font-size-0_750); line-height: 28px; text-align: center;
    appearance: textfield;
  }
  .value:focus { outline: none; border-color: var(--contrasting); }
  .value::-webkit-outer-spin-button, .value::-webkit-inner-spin-button { appearance: none; margin: 0; }
  .chart { position: relative; display: flex; margin: 0; padding: 0; line-height: 0; }
  .knob {
    --track: transparent;
    --thumb-border: 8px;
    --thumb-scale: 0.75;
    position: absolute; bottom: -8px; height: 1px; margin: 0; padding: 0; border: 0;
    background-color: transparent; transform: translateX(0.5px) rotate(-90deg); transform-origin: bottom left; appearance: none;
  }
  .knob.selected { --track: var(--stylos-color-border-secondary); --thumb-border: 5px; --thumb-scale: 1; }
  .knob:focus { outline: none; }
  .knob::-webkit-slider-runnable-track {
    height: 1px; border: 0; background: linear-gradient(var(--track), var(--track)) center / var(--canvas-height) no-repeat;
  }
  .knob::-moz-range-track {
    height: 1px; border: 0; background: linear-gradient(var(--track), var(--track)) center / var(--canvas-height) no-repeat;
  }
  .knob::-webkit-slider-thumb {
    box-sizing: border-box; width: 15px; height: 15px; margin-top: -7px; border: var(--thumb-border) solid var(--knob, gray);
    border-radius: var(--stylos-radius-round); background: transparent; box-shadow: 0 0 2px 0 var(--contrast);
    transform: scale(var(--thumb-scale)); cursor: grab; transition: var(--stylos-motion-duration-micro) ease-in-out; appearance: none;
  }
  .knob::-moz-range-thumb {
    box-sizing: border-box; width: 15px; height: 15px; border: var(--thumb-border) solid var(--knob, gray);
    border-radius: var(--stylos-radius-round); background: transparent; box-shadow: 0 0 2px 0 var(--contrast);
    transform: scale(var(--thumb-scale)); cursor: grab; transition: var(--stylos-motion-duration-micro) ease-in-out;
  }
  .knob:focus-visible::-webkit-slider-thumb { outline: var(--stylos-border-width-thick) solid var(--stylos-color-border-primary); outline-offset: 2px; }
  .knob:focus-visible::-moz-range-thumb { outline: var(--stylos-border-width-thick) solid var(--stylos-color-border-primary); outline-offset: 2px; }
  .knob::-webkit-slider-thumb:active { cursor: grabbing; }
  .knob::-moz-range-thumb:active { cursor: grabbing; }
</style>
