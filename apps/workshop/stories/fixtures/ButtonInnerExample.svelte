<script lang="ts">
  import { ButtonInner, Icon } from "@stylos/ui";
  import type { ButtonInnerProps } from "@stylos/ui";

  let args: ButtonInnerProps = $props();
</script>

{#snippet mark()}<Icon name="close" />{/snippet}
<ButtonInner {...args} icon={mark} accessibleName={args.accessibleName || "Clear field"} />
