import { useEffect, useState } from 'react'

export function useGrayscalePreview() {
  const [pinned, setPinned] = useState(false)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    const release = () => setHeld(false)
    const down = (event: KeyboardEvent) => {
      // Physical B also works with a non-Latin keyboard layout.
      if (event.code !== 'KeyB' || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select') || target?.isContentEditable) return
      event.preventDefault()
      setHeld(true)
    }
    const up = (event: KeyboardEvent) => { if (event.code === 'KeyB') release() }
    const visibility = () => { if (document.hidden) release() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  return { grayscale: pinned || held, toggleGrayscale: () => setPinned(value => !value) }
}
