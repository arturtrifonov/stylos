<script lang="ts">
  import { Accordion, Button, Modal } from '@stylos/ui'
  import { createFigmaDtcgFiles } from './figma-dtcg.mjs'
  import { createFigmaBundle } from './figma-bundle.mjs'
  import { download } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor, onClose }: { editor: Editor; onClose: () => void } = $props()
  const COLLECTIONS = ['palette.light', 'palette.dark', 'color', 'color.special']
  let isOpen = $state(true)
  const files = $derived(createFigmaDtcgFiles(editor.snapshot, editor.palette, editor.coordinates, editor.assignments))
  const transfer = () => download('stylos-colors.plugin.json', JSON.stringify(createFigmaBundle(editor.snapshot, editor.palette, editor.coordinates, editor.assignments), null, 2) + '\n')
</script>

<Modal size="medium" headingText="Export for Figma" bind:isOpen closeAccessibleName="Close export" hasPrimaryButton={false} hasSecondaryButton={false} onclose={onClose}>
  <p class="export-instructions">Standard DTCG JSON for Variables. Create or select the collection below. Use <strong>Import mode</strong> for an existing mode, or drop its JSON files into a new collection. Import the palettes first so role references can find them.</p>
  <div class="native-export-files">
    {#each COLLECTIONS as collection (collection)}
      <div class="native-export-row">
        <div><code>{collection}</code><span>{files.find(file => file.collection === collection)?.count} tokens{collection === 'color.special' ? ' · Special roles' : ''}</span></div>
        <div>
          {#each files.filter(file => file.collection === collection) as file (file.name)}
            <Button variant="outline" tone="base" size="extra small" labelText={collection.startsWith('palette.') ? 'Download JSON' : file.mode.endsWith('light') ? 'Light JSON' : 'Dark JSON'}
              onclick={() => download(file.name.replaceAll('/', '.'), JSON.stringify(file.document, null, 2) + '\n')} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
  <p class="export-note">Files contain the current draft in both themes, with its role bindings and special scale. Grayscale preview does not change exported colors. Special is exported separately; this does not move existing Figma variables.</p>
  <Accordion size="small" labelText="Advanced: transfer file for Stylos Tokens">
    <p class="export-note">The plugin normally reads published colors from the server. Use this custom format only to transfer an unpublished draft through its local JSON option.</p>
    <Button variant="outline" tone="base" size="small" labelText="Download plugin transfer" onclick={transfer} />
  </Accordion>
</Modal>
