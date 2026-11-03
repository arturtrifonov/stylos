// Huetone's worker renderer with cancellation tied to the React effect.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { Channel, TColor } from 'shared/types'
import { paletteStore } from 'store/palette'
import { chartSettingsStore } from 'store/chartSettings'
import { channelFuncs, ConcurrentSpreadRender } from './RenderStrategy'
import { drawImageOnCanvasSafe } from './drawImageOnCanvasSafe'

export function Canvas({ width, height, channel, colors }: {
  width: number; height: number; channel: Channel; colors: TColor[]
}) {
  const settings = useStore(chartSettingsStore)
  const { mode } = useStore(paletteStore)
  const ref = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const [rendering, setRendering] = useState(true)

  useEffect(() => {
    let operation: ReturnType<typeof ConcurrentSpreadRender> | undefined
    let cancelled = false
    const timer = setTimeout(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      setError(false)
      setRendering(true)
      operation = ConcurrentSpreadRender(channelFuncs, channel, {
        width, height, mode, colors, ...settings, spread: channelFuncs.length, scale: 1,
      }, (image, from, to) => {
        ctx.clearRect(from, 0, to - from, height)
        drawImageOnCanvasSafe(ctx, image, from, to, height)
      })
      operation.progress.then(() => { if (!cancelled) setRendering(false) }).catch(() => {
        if (!cancelled) { setError(true); setRendering(false) }
      })
    }, 50)
    return () => {
      cancelled = true
      clearTimeout(timer)
      operation?.abort()
    }
  }, [channel, colors, height, mode, settings, width])

  return <div className="graph-canvas" data-rendering={rendering}>
    <canvas ref={ref} width={width} height={height} aria-hidden="true" />
    {error && <p role="status">Graph rendering failed. Numeric controls are still available.</p>}
  </div>
}
