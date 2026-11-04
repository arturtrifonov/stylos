import { mount } from 'svelte'
import { registerIcons } from '@stylos/ui'
import darkMode from '@stylos/ui/icons/dark_mode'
import download from '@stylos/ui/icons/download'
import fileOpen from '@stylos/ui/icons/file_open'
import lightMode from '@stylos/ui/icons/light_mode'
import redo from '@stylos/ui/icons/redo'
import undo from '@stylos/ui/icons/undo'
import '@stylos/ui/tokens.css'
import '@stylos/ui/fonts.css'
import '@stylos/ui/text.css'
import './styles.css'
import App from './App.svelte'
import type { Snapshot } from './model.mjs'

registerIcons(darkMode, download, fileOpen, lightMode, redo, undo)

const root = document.getElementById('root')!

function loadError(message: string) {
  const main = document.createElement('main')
  main.className = 'load-error'
  for (const [tag, text] of [['h1', 'Colors could not be loaded'], ['p', message], ['p', 'Run npm run colors from the Stylos repository.']]) {
    const element = document.createElement(tag)
    element.textContent = text
    main.append(element)
  }
  root.replaceChildren(main)
}

fetch('./stylos.json')
  .then(response => {
    if (!response.ok) throw new Error(`Token snapshot could not be loaded (${response.status}).`)
    return response.json() as Promise<Snapshot>
  })
  .then(snapshot => {
    if (snapshot.schemaVersion !== 1 || !snapshot.palette || !Array.isArray(snapshot.roles)) {
      throw new Error('Unsupported token snapshot. Rebuild the color editor.')
    }
    root.replaceChildren()
    mount(App, { target: root, props: { snapshot } })
  })
  .catch(error => loadError(String(error.message)))
