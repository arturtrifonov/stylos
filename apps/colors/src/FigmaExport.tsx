import React, { useEffect, useMemo, useRef } from 'react'
import { createFigmaDtcgFiles } from './figma-dtcg.mjs'
import { createFigmaBundle } from './figma-bundle.mjs'
import type { Snapshot, Palette, Coordinates } from './model.mjs'

export function FigmaExport({ snapshot, palette, coordinates, download, onClose }: {
  snapshot: Snapshot; palette: Palette; coordinates: Coordinates
  download: (name: string, content: string) => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const files = useMemo(() => createFigmaDtcgFiles(snapshot, palette, coordinates), [snapshot, palette, coordinates])
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="figma-export" aria-labelledby="figma-export-title" onClose={onClose}>
    <div className="export-heading"><div><h2 id="figma-export-title">Export for Figma</h2><p>Standard DTCG JSON · import directly in Variables</p></div><button autoFocus onClick={() => dialog.current?.close()} aria-label="Close export">×</button></div>
    <p className="export-instructions">Create or select the collection below. Use <strong>Import mode</strong> for an existing mode, or drop its JSON files into a new collection. Import the palettes first so role references can find them.</p>
    <div className="native-export-files">{['palette.light', 'palette.dark', 'color', 'color.special'].map(collection => <div className="native-export-row" key={collection}>
      <div><code>{collection}</code><span>{files.find(file => file.collection === collection)?.count} tokens{collection === 'color.special' ? ' · Special roles' : ''}</span></div>
      <div>{files.filter(file => file.collection === collection).map(file => <button key={file.name} title={`Download ${file.name}`} onClick={() => download(file.name.replaceAll('/', '.'), JSON.stringify(file.document, null, 2) + '\n')}>{collection.startsWith('palette.') ? 'Download JSON' : file.mode.endsWith('light') ? 'Light JSON' : 'Dark JSON'}</button>)}</div>
    </div>)}</div>
    <p className="export-note">Files contain the current draft in both themes. Grayscale preview does not change exported colors. Special is exported separately; this does not move existing Figma variables.</p>
    <details className="plugin-transfer"><summary>Advanced: transfer file for Stylos Tokens</summary><p>The plugin normally reads published colors from the server. Use this custom format only to transfer an unpublished draft through its local JSON option.</p><button onClick={() => download('stylos-colors.plugin.json', JSON.stringify(createFigmaBundle(snapshot, palette, coordinates), null, 2) + '\n')}>Download plugin transfer</button></details>
  </dialog>
}
