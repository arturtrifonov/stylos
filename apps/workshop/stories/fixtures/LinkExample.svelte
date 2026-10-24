<script lang="ts">
  import { Link } from "@stylos/ui";
  import type { LinkProps } from "@stylos/ui";

  let args: LinkProps = $props();
</script>

{#if args.hasExpandedHitArea}
  <article class="stylos-link-area">
    <Link {...args} />
    <p>The whole card opens this destination.</p>
  </article>
{:else}
  <Link {...args} />
{/if}

<style>
  article {
    padding: var(--stylos-dimension-gap-g-2_000);
    border: var(--stylos-border-width-thin) solid var(--stylos-color-border-default);
    border-radius: var(--stylos-radius-small);
  }
</style>
