<script lang="ts">
  import { untrack } from 'svelte'
  import { Button, ButtonIcon, Icon, Link, Switcher, SwitcherItem, TabItem, TabsHorizontal, AlertInline, ToggleLabel } from '@stylos/ui'
  import { Editor, download } from './editor.svelte'
  import type { View } from './editor.svelte'
  import type { Snapshot } from './model.mjs'
  import ChangesView from './ChangesView.svelte'
  import FigmaExport from './FigmaExport.svelte'
  import PaletteView from './PaletteView.svelte'
  import RolesView from './RolesView.svelte'
  import ServerWorkspace from './ServerWorkspace.svelte'

  let { snapshot }: { snapshot: Snapshot } = $props()
  // The snapshot is fixed for the session: a new source means a new load.
  const editor = new Editor(untrack(() => snapshot))
  const VIEWS: View[] = ['Palette', 'Semantic', 'Special', 'Changes']
  let fileInput: HTMLInputElement
  let exporting = $state(false)

  $effect(() => { document.documentElement.dataset.theme = editor.theme })
  $effect(() => editor.persist())

  function shortcut(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    const textInput = target instanceof HTMLTextAreaElement || target?.isContentEditable ||
      target instanceof HTMLSelectElement || target instanceof HTMLInputElement && !['range', 'number', 'color', 'checkbox', 'button'].includes(target.type)
    if (textInput || !(event.ctrlKey || event.metaKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key !== 'z' && key !== 'y') return
    event.preventDefault()
    if (key === 'y' || event.shiftKey) editor.redo()
    else editor.undo()
  }
  function holdGrayscale(event: KeyboardEvent) {
    // Physical B also works with a non-Latin keyboard layout.
    if (event.code !== 'KeyB' || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    if (target instanceof HTMLElement && (target.closest('input:not([type="range"], [type="checkbox"], [type="radio"]), textarea, select') || target.isContentEditable)) return
    event.preventDefault()
    editor.grayscaleHeld = true
  }
  function release() {
    editor.endEdit()
    editor.grayscaleHeld = false
  }
</script>

<svelte:window onkeydown={event => { shortcut(event); holdGrayscale(event) }}
  onkeyup={event => { if (event.code === 'KeyB') editor.grayscaleHeld = false }}
  onpointerup={editor.endEdit} onpointercancel={editor.endEdit} onblur={release} />
<svelte:document onvisibilitychange={() => { if (document.hidden) editor.grayscaleHeld = false }} />

<div class="app-shell">
  <header class="app-header">
    <div class="wordmark">stylos<span class="wordmark-divider"></span><span>Colors</span></div>
    <h1 class="header-title">The system, in color.</h1>
    <div class="header-actions">
      <Button variant="outline" tone="base" size="small" labelText="Open JSON…" hasLeadingIcon onclick={() => fileInput.click()}>
        {#snippet leadingIcon()}<Icon name="file_open" />{/snippet}
      </Button>
      <input bind:this={fileInput} hidden type="file" accept=".json,application/json"
        onchange={event => { void editor.loadFile(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} />
      <Button variant="outline" tone="base" size="small" labelText="Export for Figma…" onclick={() => { exporting = true }} />
      <Button size="small" labelText={`Save draft · ${editor.editedCount}`} hasLeadingIcon state={editor.editedCount ? 'default' : 'disabled'}
        onclick={() => download('stylos-colors.draft.json', JSON.stringify(editor.patch, null, 2) + '\n')}>
        {#snippet leadingIcon()}<Icon name="download" />{/snippet}
      </Button>
    </div>
  </header>

  {#if exporting}<FigmaExport {editor} onClose={() => { exporting = false }} />{/if}
  <ServerWorkspace {editor} />

  <main>
    <div class="workspace-toolbar">
      <div class="view-tabs"><TabsHorizontal size="small" bind:value={editor.view} accessibleName="Color views">
        {#snippet tabsSlot()}
          {#each VIEWS as item (item)}
            <TabItem value={item} labelText={item} id={`tab-${item}`} controls="view-panel"
              hasBadge={item === 'Changes' && editor.editedCount > 0} numberText={String(editor.editedCount)} />
          {/each}
        {/snippet}
      </TabsHorizontal></div>
      <div class="editing-toolbar">
        <div class="history-controls" role="group" aria-label="Edit history">
          <span title="Undo · Ctrl/Cmd+Z"><ButtonIcon variant="ghost" tone="base" size="small" accessibleName="Undo"
            state={editor.history.past.length ? 'default' : 'disabled'} onclick={editor.undo}>{#snippet icon()}<Icon name="undo" />{/snippet}</ButtonIcon></span>
          <span title="Redo · Ctrl/Cmd+Shift+Z or Ctrl+Y"><ButtonIcon variant="ghost" tone="base" size="small" accessibleName="Redo"
            state={editor.history.future.length ? 'default' : 'disabled'} onclick={editor.redo}>{#snippet icon()}<Icon name="redo" />{/snippet}</ButtonIcon></span>
        </div>
        <span title={`Preview lightness in ${editor.space.toUpperCase()} without chroma. Hold B for a temporary preview.`}>
          <ToggleLabel size="small" labelText="Grayscale"
            bind:isChecked={() => editor.grayscale ? 'true' : 'false', checked => { editor.grayscalePinned = checked === 'true' }} />
        </span>
        <Switcher size="small" bind:value={editor.theme} accessibleName="Palette theme">
          <SwitcherItem value="light" labelText="Light" hasLeadingIcon>{#snippet leadingIcon()}<Icon name="light_mode" />{/snippet}</SwitcherItem>
          <SwitcherItem value="dark" labelText="Dark" hasLeadingIcon>{#snippet leadingIcon()}<Icon name="dark_mode" />{/snippet}</SwitcherItem>
        </Switcher>
        <span title="Reset all changes in both themes. This can be undone.">
          <Button variant="outline" tone="base" size="small" labelText="Reset changes" state={editor.editedCount || editor.recovery ? 'default' : 'disabled'} onclick={editor.reset} />
        </span>
      </div>
    </div>

    {#if editor.notice}
      <div class="notice">
        <AlertInline size="small" hasHeading={false} hasCloseButton closeAccessibleName="Dismiss message" hasIcon={false}
          hasButtons={Boolean(editor.recovery)} primaryButtonText="Download saved draft" secondaryButtonText="Dismiss"
          onprimaryclick={() => download('stylos-colors.saved-draft.json', editor.recovery)}
          onsecondaryclick={() => { editor.notice = '' }} onclose={() => { editor.notice = '' }}>{editor.notice}</AlertInline>
      </div>
    {/if}

    <div id="view-panel" role="tabpanel" aria-labelledby={`tab-${editor.view}`}>
      {#if editor.view === 'Palette'}<PaletteView {editor} />
      {:else if editor.view === 'Changes'}<ChangesView {editor} />
      {:else}<RolesView {editor} special={editor.view === 'Special'} />{/if}
    </div>
  </main>

  <footer class="app-footer">
    <span>{editor.editedCount ? `${editor.editedCount} edited values · ` : ''}{editor.storageAvailable ? 'Draft saved in this browser' : 'Save a file to keep your draft'}</span>
    <span class="footer-credit">Color engine & graphs adapted from <Link size="small" tone="base" href="https://github.com/ardov/huetone" labelText="Huetone" /> · <Link size="small" tone="base" href="./LICENSE.huetone.txt" labelText="MIT" /></span>
  </footer>
</div>
