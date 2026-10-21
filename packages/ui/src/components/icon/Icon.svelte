<script lang="ts">
  // Icon — docs/components/registry/icon.yaml. The wrapper takes the
  // contract's props and renders the drawing the registry resolves; it is the only
  // Svelte-specific file in the component (ADR 0002).
  //
  // `name` is a name in the active icon preset. The default preset currently
  // retains Material Symbols names; that is an implementation convention, not
  // part of the Icon contract (docs/foundations/icons.md).
  //
  // Any mark in the preset's catalogue can be named once it is registered
  // (registry.ts); the registered marks resolve from the start. A name that
  // resolves to nothing renders nothing. There is no placeholder
  // mark: in Figma a placeholder marks an instance nobody has chosen yet,
  // which is a state a design file has and a program does not — an icon that
  // was not chosen is not written (docs/foundations/icons.md).
  //
  // Always aria-hidden. Whether the mark needs an accessible name is the
  // parent's question and nothing here can answer it: a mark that is the only
  // thing saying what a control does has to be named on the control, and a
  // mark repeating the words beside it has to be silent or it is read twice.
  // Both are the consumer's obligations (the entry's `requires` finding).
  import "./icon.css";
  import { resolveIcon } from "./registry.ts";
  import type { IconProps } from "./props.ts";

  let { name }: IconProps = $props();

  const drawing = $derived(name ? resolveIcon(name) : undefined);
</script>

{#if drawing}
  <svg
    class="stylos-icon"
    viewBox={drawing.viewBox}
    aria-hidden="true"
    focusable="false"
    data-name={name}
    xmlns="http://www.w3.org/2000/svg"
  >
    {#each drawing.paths as path (path.d)}
      <path d={path.d} fill-rule={path.fillRule} />
    {/each}
  </svg>
{/if}
