import React, { useEffect, useState } from 'react'
import type { ChangeSet } from './model.mjs'

type Session = { user: { name: string }; csrf: string }
type Working = { revision: string; updatedAt: string | null; draft: ChangeSet }

export function ServerWorkspace({ draft, onOpen, onPublished, onNotice }: { draft: ChangeSet; onOpen: (draft: ChangeSet) => void; onPublished: (input: unknown) => void; onNotice: (text: string) => void }) {
  const [available, setAvailable] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [working, setWorking] = useState<Working | null>(null)
  const [busy, setBusy] = useState(false)
  const current = JSON.stringify(draft)
  const saved = working ? JSON.stringify(working.draft) : null
  useEffect(() => {
    let active = true
    fetch('./api/session', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return
      const data = await response.json() as Session
      if (active) { setAvailable(true); setSession(data.user ? data : null) }
    }).catch(() => {})
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    if (!session) { setWorking(null); return }
    fetch('./api/stylos', { cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Could not read the working copy.')
      if (active) setWorking(data as Working)
    }).catch(error => { if (active) onNotice(error.message) })
    return () => { active = false }
  }, [session])
  async function openPublished() {
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch('./stylos-colors.figma.json', { credentials: 'omit', cache: 'no-store' })
      if (!response.ok) throw new Error('Could not load published colors (HTTP '+response.status+').')
      onPublished(await response.json())
      onNotice('Published Stylos colors opened. Undo restores your browser draft.')
    } catch (error) { onNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  async function openWorking() {
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch('./api/stylos', { cache: 'no-store' })
      const data = await response.json()
      if (response.status === 401) setSession(null)
      if (!response.ok) throw new Error(data.message ?? 'Could not read the working copy.')
      onOpen((data as Working).draft); setWorking(data as Working)
      onNotice('Server working copy opened. Undo restores your browser draft.')
    } catch (error) { onNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  async function command(action: 'save' | 'publish' | 'logout') {
    if (!session || busy) return
    setBusy(true)
    try {
      const url = action === 'save' ? './api/stylos' : action === 'publish' ? './api/stylos/publish' : './auth/logout'
      const response = await fetch(url, { method: action === 'save' ? 'PUT' : 'POST', headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf, 'If-Match': working?.revision ?? '',
      }, ...(action === 'save' ? { body: current } : {}) })
      const data = await response.json()
      if (response.status === 401) setSession(null)
      if (response.status === 409) setWorking(null)
      if (!response.ok) throw new Error(data.message ?? 'The server could not complete this action.')
      if (action === 'save') { setWorking(data as Working); onNotice('Stylos working copy saved on the server. Published colors have not changed.') }
      else if (action === 'publish') onNotice('Saved Stylos colors published. Reload tokens in the Figma plugin to review them.')
      else { setSession(null); onNotice('Signed out. Your browser draft is still here.') }
    } catch (error) { onNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  if (!available) return null
  return <section className="server-workspace" aria-label="Stylos server workspace">
    <div><strong>Stylos workspace</strong><span>{session ? working?.updatedAt ? `Saved ${new Date(working.updatedAt).toLocaleString()}` : 'No working copy saved yet' : 'Open JSON and edit freely. Sign in to save Stylos.'}</span></div>
    <button disabled={busy} onClick={() => { void openPublished() }}>Open published colors</button>
    {session ? <>
      <span className="server-user">{session.user.name}</span>
      <button disabled={busy || working?.revision === '0'} onClick={() => { void openWorking() }}>Open working copy</button>
      <button disabled={busy || !working || working.revision !== '0' && current === saved} onClick={() => { void command('save') }}>Save working copy</button>
      <button className="primary" disabled={busy || !working || working.revision === '0' || current !== saved} title="Publish the saved working copy for the Figma plugin" onClick={() => { void command('publish') }}>Publish colors</button>
      <button disabled={busy} onClick={() => { void command('logout') }}>Sign out</button>
    </> : <a className="server-login" href="./auth/login">Sign in with Pocket ID</a>}
  </section>
}
