<script lang="ts">
  import { InputText } from '@stylos/ui'
  import { HEX } from './editor.svelte'

  let { value, onChange, onEditStart, onEditEnd }: {
    value: string; onChange: (value: string) => void; onEditStart: () => void; onEditEnd: () => void
  } = $props()
  let text = $derived(value)
  const invalid = $derived(!HEX.test(text))

  // InputText calls oninput before its binding reaches text.
  function typed(event: Event) {
    const next = (event.target as HTMLInputElement).value
    onEditStart()
    if (HEX.test(next)) onChange(next)
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hex-editor" onfocusin={onEditStart}
  onfocusout={() => { text = value; onEditEnd() }}
  onkeydown={event => { if (event.key === 'Enter' || event.key === 'Escape') (event.target as HTMLElement).blur() }}>
  <input type="color" {value} aria-label="Pick selected color" oninput={event => { onEditStart(); onChange(event.currentTarget.value) }} />
  <InputText size="small" hasLabel={false} accessibleName="Selected color HEX" bind:value={text} validation={invalid ? 'error' : 'off'} oninput={typed} />
</div>
