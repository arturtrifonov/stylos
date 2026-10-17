<script lang="ts">
  import { Switcher, SwitcherItem } from "@stylos/ui";
  import type { SwitcherItemProps } from "@stylos/ui";
  let args: SwitcherItemProps = $props();
</script>
<Switcher size={args.size} tone={args.tone}><SwitcherItem {...args} /></Switcher>
