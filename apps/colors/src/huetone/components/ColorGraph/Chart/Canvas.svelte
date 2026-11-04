<script lang="ts">
  // Huetone's worker renderer with cancellation tied to the effect.
  import type { Channel, TColor } from 'shared/types'
  import type { spaceName } from 'shared/types'
  import { channelFuncs, ConcurrentSpreadRender } from './RenderStrategy'
  import { drawImageOnCanvasSafe } from './drawImageOnCanvasSafe'

  let { width, height, channel, colors, mode, showColors }: {
    width: number; height: number; channel: Channel; colors: TColor[]; mode: spaceName; showColors: boolean
  } = $props()
  let canvas: HTMLCanvasElement
  let failed = $state(false)
  let rendering = $state(true)

  $effect(() => {
    const settings = { width, height, mode, colors, showColors, showP3: false, showRec2020: false, spread: channelFuncs.length, scale: 1 }
    const target = channel
    let operation: ReturnType<typeof ConcurrentSpreadRender> | undefined
    let cancelled = false
    const timer = setTimeout(() => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      failed = false
      rendering = true
      operation = ConcurrentSpreadRender(channelFuncs, target, settings, (image, from, to) => {
        ctx.clearRect(from, 0, to - from, settings.height)
        drawImageOnCanvasSafe(ctx, image, from, to, settings.height)
      })
      operation.progress.then(() => { if (!cancelled) rendering = false }).catch(() => {
        if (!cancelled) { failed = true; rendering = false }
      })
    }, 50)
    return () => {
      cancelled = true
      clearTimeout(timer)
      operation?.abort()
    }
  })
</script>

<div class="graph-canvas" data-rendering={rendering}>
  <canvas bind:this={canvas} {width} {height} aria-hidden="true"></canvas>
  {#if failed}<p role="status">Graph rendering failed. Numeric controls are still available.</p>{/if}
</div>
