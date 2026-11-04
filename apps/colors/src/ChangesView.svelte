<script lang="ts">
  import { Accordion, Button, TableCellHeading, TableCellText, TableRowBody, TableRowHead, TextArea } from '@stylos/ui'
  import { PALETTE } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()
  const patch = $derived(editor.patch)
  const short = (ref: string) => ref.slice(PALETTE.length)
  const points = $derived(Object.keys(editor.coordinates).length)
  const json = $derived(JSON.stringify(patch, null, 2))
</script>

<section class="changes-panel">
  <div class="panel-heading">
    <h2 class="stylos-heading-h5">Draft changes</h2>
    <Button variant="outline" tone="base" size="small" labelText="Reset draft" state={editor.editedCount || editor.recovery ? 'default' : 'disabled'} onclick={editor.reset} />
  </div>
  {#if editor.editedCount}
    {#if patch.changes.length}
      <div class="changes-scroll">
        <table>
          <caption>Palette values</caption>
          <thead><TableRowHead size="small"><TableCellHeading cellText="Token" /><TableCellHeading cellText="Theme" /><TableCellHeading cellText="Source" /><TableCellHeading cellText="Draft" /><th><span class="sr-only">Actions</span></th></TableRowHead></thead>
          <tbody>
            {#each patch.changes as change (`${change.path}:${change.mode}`)}
              <TableRowBody size="small">
                <TableCellText cellText={change.path} /><TableCellText cellText={change.mode} />
                <TableCellText cellText={change.before ?? 'New token'} hasIcon>{#snippet icon()}<span class="role-dot" style:background={editor.previewColor(change.before ?? 'transparent')}></span>{/snippet}</TableCellText>
                <TableCellText cellText={change.after} hasIcon>{#snippet icon()}<span class="role-dot" style:background={editor.previewColor(change.after)}></span>{/snippet}</TableCellText>
                <td class="action-cell"><Button variant="ghost" tone="base" size="extra small" labelText="Revert" onclick={() => editor.revert(short(change.path), change.mode)} /></td>
              </TableRowBody>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if patch.roles?.length}
      <div class="changes-scroll">
        <table>
          <caption>Role bindings</caption>
          <thead><TableRowHead size="small"><TableCellHeading cellText="Role" /><TableCellHeading cellText="Theme" /><TableCellHeading cellText="Source" /><TableCellHeading cellText="Draft" /><th><span class="sr-only">Actions</span></th></TableRowHead></thead>
          <tbody>
            {#each patch.roles as change (`${change.path}:${change.mode}`)}
              <TableRowBody size="small">
                <TableCellText cellText={change.path} /><TableCellText cellText={change.mode} /><TableCellText cellText={short(change.before)} /><TableCellText cellText={short(change.after)} />
                <td class="action-cell"><Button variant="ghost" tone="base" size="extra small" labelText="Revert" onclick={() => editor.revertRole(change.path, change.mode)} /></td>
              </TableRowBody>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if patch.scale?.length}
      <div class="changes-scroll">
        <table>
          <caption>Special scale</caption>
          <thead><TableRowHead size="small"><TableCellHeading cellText="Role" /><TableCellHeading cellText="Theme" /><TableCellHeading cellText="Source" /><TableCellHeading cellText="Draft" /><th><span class="sr-only">Actions</span></th></TableRowHead></thead>
          <tbody>
            {#each patch.scale as change (`${change.template}:${change.mode}`)}
              <TableRowBody size="small">
                <TableCellText cellText={change.template} /><TableCellText cellText={change.mode} /><TableCellText cellText={short(change.before)} /><TableCellText cellText={short(change.after)} />
                <td class="action-cell"><Button variant="ghost" tone="base" size="extra small" labelText="Revert" onclick={() => editor.revertScale(change.template, change.mode)} /></td>
              </TableRowBody>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    <div class="empty-state"><h3>The source is unchanged.</h3><p>Edit a swatch, move a point on a graph or reassign a role to start a draft.</p></div>
  {/if}
  <p class="section-note">{points > 0 ? `${points} LCH graph points are preserved in this draft. ` : ''}Save draft keeps original values and collects edits from both themes. Canonical tokens are updated separately.</p>
  <div class="export-data">
    <Accordion size="small" labelText="Draft file (JSON)">
      <TextArea size="small" hasLabel={false} accessibleName="Changes JSON" state="read only" value={json} />
    </Accordion>
  </div>
</section>
