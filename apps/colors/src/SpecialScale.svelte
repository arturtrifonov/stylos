<script lang="ts">
  // The authored special scale (FND-COLOR-14): one step per role and theme,
  // taken by every hue at once.
  import { ButtonIcon, DropdownItemDefault, Icon, Select } from '@stylos/ui'
  import { MODES, rampPaths, resolveRole, scaleKeepsHue } from './model.mjs'
  import type { Theme } from './model.mjs'
  import { roleLabel } from './role-groups.mjs'
  import { PALETTE } from './editor.svelte'
  import type { Editor } from './editor.svelte'

  let { editor }: { editor: Editor } = $props()
  const HUE = '{hue}'
  const scale = $derived(editor.snapshot.specialScale as { exclude: string[]; roles: Record<string, Record<string, string>> })
  const templates = $derived(Object.keys(scale.roles))
  const hues = $derived(editor.hues.filter(hue => !scale.exclude.includes(hue)))
  const steps = $derived(rampPaths(editor.palette, hues[0]).map(path => path.split('/')[1]))
  const name = (template: string) => roleLabel(template.replace(`special/${HUE}`, '').replace('//', '/').replace(/\/$/, ''))
  const hueOf = (ref: string) => ref.slice(PALETTE.length).split('/')[0]
  const stepOf = (ref: string) => ref.slice(PALETTE.length).split('/')[1]
  const assign = (template: string, mode: Theme, hue: string, step: string) => editor.assignScale(template, mode, `${PALETTE}${hue}/${step}`)
  function sample(template: string, hue: string) {
    const path = template.replace(HUE, hue)
    return { css: editor.roleCss(path), ...resolveRole(editor.project, editor.palette, path, editor.theme) }
  }
</script>

<section class="scale-panel" aria-label="Special scale">
  <div class="panel-heading">
    <h2 class="stylos-heading-h5">Special scale</h2>
    <span class="muted">One step per role and theme; every hue follows it.</span>
  </div>
  <div class="scale-scroll">
    <table class="scale-table">
      <thead><tr><th scope="col">Role</th><th scope="col">Light step</th><th scope="col">Dark step</th><th scope="col">Every hue · {editor.theme}</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>
        {#each templates as template (template)}
          {@const edited = Boolean(editor.assignments.scale[template])}
          <tr class:edited>
            <th scope="row">{name(template)}</th>
            {#each MODES as mode (mode)}
              {@const ref = editor.scaleRef(template, mode)}
              <td>
                <div class="scale-step">
                  {#if !scaleKeepsHue(template)}
                    {#key editor.hues.join()}
                      <Select size="extra small" hasLabel={false} accessibleName={`${name(template)} ${mode} hue`} maxHeight="280px" inputText={hueOf(ref)}
                        bind:value={() => hueOf(ref), hue => assign(template, mode, hue, stepOf(ref))}>
                        {#each hues as hue (hue)}<DropdownItemDefault value={hue} labelText={hue} />{/each}
                      </Select>
                    {/key}
                  {/if}
                  {#key steps.join()}
                    <Select size="extra small" hasLabel={false} accessibleName={`${name(template)} ${mode} step`} maxHeight="280px" inputText={stepOf(ref)}
                      bind:value={() => stepOf(ref), step => assign(template, mode, hueOf(ref), step)}>
                      {#each steps as step (step)}<DropdownItemDefault value={step} labelText={step} />{/each}
                    </Select>
                  {/key}
                </div>
              </td>
            {/each}
            <td>
              <div class="scale-hues">
                {#each hues as hue (hue)}
                  {@const color = sample(template, hue)}
                  <span class="scale-hue" style:background={color.css} title={`${hue} · ${color.ref.slice(PALETTE.length)} · ${color.value}`}></span>
                {/each}
              </div>
            </td>
            <td class="action-cell">
              {#if edited}
                <span title="Revert this role in both themes"><ButtonIcon variant="ghost" tone="base" size="extra small" accessibleName={`Revert ${name(template)}`}
                  onclick={() => editor.revertScale(template)}>{#snippet icon()}<Icon name="undo" />{/snippet}</ButtonIcon></span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
