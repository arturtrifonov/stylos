<script lang="ts">
  import { Link, Icon } from "@stylos/ui";
  import type { LinkProps } from "@stylos/ui";

  type Props = Omit<LinkProps, "leadingIcon" | "trailingIcon"> & {
    leadingIconName?: string;
    trailingIconName?: string;
  };

  let { leadingIconName = "add", trailingIconName = "arrow_forward", ...args }: Props = $props();
</script>

{#snippet leading()}<Icon name={leadingIconName} />{/snippet}
{#snippet trailing()}<Icon name={trailingIconName} />{/snippet}
{#if args.hasExpandedHitArea}
  <article class="stylos-link-area">
    <Link {...args} leadingIcon={leading} trailingIcon={trailing} />
    <p>The whole card opens this destination.</p>
  </article>
{:else}
  <Link {...args} leadingIcon={leading} trailingIcon={trailing} />
{/if}

<style>
  article {
    padding: var(--stylos-dimension-gap-g-2_000);
    border: var(--stylos-border-width-thin) solid var(--stylos-color-border-default);
    border-radius: var(--stylos-radius-small);
  }
</style>
