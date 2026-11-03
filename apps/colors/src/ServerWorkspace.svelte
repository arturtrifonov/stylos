<script lang="ts">
  import { Button, Link } from '@stylos/ui'
  import type { ChangeSet } from './model.mjs'
  import type { Editor } from './editor.svelte'

  type Session = { user: { name: string } | null; csrf: string }
  type Working = { revision: string; updatedAt: string | null; draft: ChangeSet }

  let { editor }: { editor: Editor } = $props()
  let available = $state(false)
  let session = $state.raw<Session | null>(null)
  let working = $state.raw<Working | null>(null)
  let busy = $state(false)
  const current = $derived(JSON.stringify(editor.patch))
  const saved = $derived(working ? JSON.stringify(working.draft) : null)

  $effect(() => {
    let active = true
    fetch('./api/session', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return
      const data = await response.json() as Session
      if (active) { available = true; session = data.user ? data : null }
    }).catch(() => {})
    return () => { active = false }
  })
  $effect(() => {
    let active = true
    if (!session) { working = null; return }
    fetch('./api/stylos', { cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Could not read the working copy.')
      if (active) working = data as Working
    }).catch(error => { if (active) editor.notice = error.message })
    return () => { active = false }
  })

  async function task(work: () => Promise<void>) {
    if (busy) return
    busy = true
    try { await work() }
    catch (error) { editor.notice = (error as Error).message }
    finally { busy = false }
  }
  const openPublished = () => task(async () => {
    const response = await fetch('./stylos-colors.figma.json', { credentials: 'omit', cache: 'no-store' })
    if (!response.ok) throw new Error(`Could not load published colors (HTTP ${response.status}).`)
    if (editor.openBundle(await response.json())) editor.notice = 'Published Stylos colors opened. Undo restores your browser draft.'
  })
  const openWorking = () => task(async () => {
    const response = await fetch('./api/stylos', { cache: 'no-store' })
    const data = await response.json()
    if (response.status === 401) session = null
    if (!response.ok) throw new Error(data.message ?? 'Could not read the working copy.')
    if (editor.openDraft((data as Working).draft)) editor.notice = 'Server working copy opened. Undo restores your browser draft.'
    working = data as Working
  })
  const command = (action: 'save' | 'publish' | 'logout') => task(async () => {
    if (!session) return
    const url = action === 'save' ? './api/stylos' : action === 'publish' ? './api/stylos/publish' : './auth/logout'
    const response = await fetch(url, { method: action === 'save' ? 'PUT' : 'POST', headers: {
      'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf, 'If-Match': working?.revision ?? '',
    }, ...(action === 'save' ? { body: current } : {}) })
    const data = await response.json()
    if (response.status === 401) session = null
    if (response.status === 409) working = null
    if (!response.ok) throw new Error(data.message ?? 'The server could not complete this action.')
    if (action === 'save') { working = data as Working; editor.notice = 'Stylos working copy saved on the server. Published colors have not changed.' }
    else if (action === 'publish') editor.notice = 'Saved Stylos colors published. Reload tokens in the Figma plugin to review them.'
    else { session = null; editor.notice = 'Signed out. Your browser draft is still here.' }
  })
  const enabled = (condition: boolean) => condition ? 'default' as const : 'disabled' as const
</script>

{#if available}
  <section class="server-workspace" aria-label="Stylos server workspace">
    <div>
      <strong>Stylos workspace</strong>
      <span>{session ? working?.updatedAt ? `Saved ${new Date(working.updatedAt).toLocaleString()}` : 'No working copy saved yet' : 'Open JSON and edit freely. Sign in to save Stylos.'}</span>
    </div>
    <Button variant="outline" tone="base" size="small" labelText="Open published colors" state={enabled(!busy)} onclick={openPublished} />
    {#if session}
      <span class="server-user">{session.user?.name}</span>
      <Button variant="outline" tone="base" size="small" labelText="Open working copy" state={enabled(!busy && working?.revision !== '0')} onclick={openWorking} />
      <Button variant="outline" tone="base" size="small" labelText="Save working copy" state={enabled(!busy && Boolean(working) && (working?.revision === '0' || current !== saved))} onclick={() => command('save')} />
      <span title="Publish the saved working copy for the Figma plugin"><Button size="small" labelText="Publish colors" state={enabled(!busy && Boolean(working) && working?.revision !== '0' && current === saved)} onclick={() => command('publish')} /></span>
      <Button variant="ghost" tone="base" size="small" labelText="Sign out" state={enabled(!busy)} onclick={() => command('logout')} />
    {:else}
      <Link size="small" tone="base" href="./auth/login" labelText="Sign in with Pocket ID" />
    {/if}
  </section>
{/if}
