import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import type { Snapshot } from './model.mjs'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
fetch('./stylos.json')
  .then(response => {
    if (!response.ok) throw new Error(`Token snapshot could not be loaded (${response.status}).`)
    return response.json() as Promise<Snapshot>
  })
  .then(snapshot => {
    if (snapshot.schemaVersion !== 1 || !snapshot.palette || !Array.isArray(snapshot.roles)) {
      throw new Error('Unsupported token snapshot. Rebuild the color editor.')
    }
    root.render(<App snapshot={snapshot} />)
  })
  .catch(error => root.render(<main className="load-error"><h1>Colors could not be loaded</h1><p>{String(error.message)}</p><p>Run <code>npm run colors</code> from the Stylos repository.</p></main>))
