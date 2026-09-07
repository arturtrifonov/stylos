<script lang="ts">
  // Icon — docs/components/registry/icon.yaml. The wrapper takes the
  // contract's props and renders the drawing icons.ts carries; it is the only
  // Svelte-specific file in the component (ADR 0002).
  //
  // `name` is a Material Symbols name — decided 2026-09-07, amending SPEC
  // 0012 §2: one door over the whole library rather than a Stylos vocabulary
  // covering twenty-nine of 3,905.
  //
  // A name the build does not carry renders nothing. There is no placeholder
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
  import { icons } from "./icons.ts";
  import type { IconProps } from "./props.ts";

  let { name }: IconProps = $props();

  const drawing = $derived(name ? icons[name] : undefined);
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
