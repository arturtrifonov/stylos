<script lang="ts">
  import { untrack } from "svelte";
  import { Modal, Drawer, Button } from "@stylos/ui";
  import type { ModalProps, DrawerProps } from "@stylos/ui";
  let { kind, isOpen = false, ...args }: (ModalProps & DrawerProps) & { kind: "modal" | "drawer" } = $props();
  let previousArg = untrack(() => isOpen);
  let open = $state(previousArg);
  $effect(() => {
    if (isOpen !== previousArg) { previousArg = isOpen; open = isOpen; }
  });
  const text = "Amet sodales morbi. Neque voluptatem porttitor congue tristique accumsan. Urna pretium tincidunt. Nam nulla nulla tortor odio massa augue pulvinar sit. In fermentum sed. Luctus dolor libero. Aliquam id facilisis. Urna velit eleifend. Donec explicabo risus. Amet sodales morbi. Neque voluptatem porttitor congue tristique dolor libero. Aliquam id facilisis. Urna velit eleifend. Donec explicabo risus.";
</script>

<Button labelText={kind === "modal" ? "Open Modal" : "Open Drawer"} onclick={() => { open = true; }} />
{#snippet content()}
  <p class="stylos-text-base-{(args.size ?? 'medium').replace(' ', '-')}" style:margin="0" style:width="100%">{text}</p>
{/snippet}
{#if kind === "modal"}
  <Modal {...args} bind:isOpen={open} children={content} onprimaryclick={() => { open = false; }} />
{:else}
  <Drawer {...args} bind:isOpen={open} children={content} onprimaryclick={() => { open = false; }} />
{/if}
