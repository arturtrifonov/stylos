<script lang="ts">
  import { Accordion, DropdownItemDefault, InputSearch, Select, Switcher, SwitcherItem } from '@stylos/ui'
  import { ROLE_STATES, roleLabel } from './role-groups.mjs'
  import RoleCard from './RoleCard.svelte'
  import RoleInspector from './RoleInspector.svelte'
  import SpecialScale from './SpecialScale.svelte'
  import type { Editor } from './editor.svelte'

  let { editor, special }: { editor: Editor; special: boolean } = $props()
  let filter = $state('')
  let comparePath = $state('background/base')
  let presentation = $state('context')

  const groups = $derived(editor.groupedRoles(special, filter))
  const backgrounds = $derived(editor.project.roles.filter(role => role.path.startsWith('background/')))
  const ground = $derived(backgrounds.some(role => role.path === comparePath) ? comparePath : 'background/base')
  const selectedRole = $derived(editor.project.roles.find(role => role.path === editor.selectedRolePath))
  const count = (area: (typeof groups)[number]) => area.sections.reduce((total, section) => total + section.families.reduce((sum, family) => sum + family.roles.length, 0), 0)
</script>

{#if special}<SpecialScale {editor} />{/if}

<div class="roles-workspace" class:with-inspector={!special}>
  <section class="roles-panel">
    <div class="roles-toolbar">
      <div class="search-field"><InputSearch size="small" labelText="Find a role" bind:value={filter} hasPlaceholder placeholderText="Filter by role, hue or state…" /></div>
      <Switcher size="small" bind:value={presentation} accessibleName="Role presentation">
        <SwitcherItem value="context" labelText="In context" />
        <SwitcherItem value="swatches" labelText="Swatches" />
      </Switcher>
      <div class="ground-field">
        <Select size="small" labelText="Preview background" bind:value={comparePath} inputText={ground} maxHeight="280px">
          {#each backgrounds as role (role.path)}<DropdownItemDefault value={role.path} labelText={role.path} />{/each}
        </Select>
      </div>
    </div>
    {#each groups as area (area.area)}
      <div class="role-area">
        <Accordion size="small" headingLevel="2" isExpanded labelText={`${roleLabel(area.area)} · ${count(area)}`}>
          {#each area.sections as section (section.name)}
            <section class="role-section" aria-label={`${roleLabel(area.area)}${section.name ? ` / ${roleLabel(section.name)}` : ''}`}>
              {#if section.name}<h3>{roleLabel(section.name)}</h3>{/if}
              {#if area.area === 'surface'}
                <div class="state-headings" aria-hidden="true"><span></span>{#each ROLE_STATES as state (state)}<span>{roleLabel(state)}</span>{/each}</div>
              {/if}
              {#each section.families as family (family.name)}
                <div class={area.area === 'surface' ? 'role-family' : 'role-grid'} role="group" aria-label={[area.area, section.name, family.name].filter(Boolean).map(roleLabel).join(' / ')}>
                  {#if family.name}<h4>{roleLabel(family.name)}</h4>{/if}
                  {#each family.roles as role (role.path)}
                    <RoleCard {editor} {role} comparePath={ground} swatches={presentation === 'swatches'} selected={!special && role.path === editor.selectedRolePath}
                      onSelect={() => { if (special) editor.openStep(editor.roleBinding(role, editor.theme)); else editor.selectedRolePath = role.path }} />
                  {/each}
                </div>
              {/each}
            </section>
          {/each}
        </Accordion>
      </div>
    {:else}
      <p class="empty-state">No roles match “{filter}”.</p>
    {/each}
  </section>
  {#if !special && selectedRole}<RoleInspector {editor} role={selectedRole} comparePath={ground} />{/if}
</div>
