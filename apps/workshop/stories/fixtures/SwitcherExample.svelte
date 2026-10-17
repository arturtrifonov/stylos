<script lang="ts">
  import { Switcher, SwitcherItem } from "@stylos/ui";
  import type { SwitcherProps } from "@stylos/ui";
  let args: SwitcherProps = $props();
</script>
<Switcher {...args}>
  <SwitcherItem value="one" labelText="Option 1" />
  <SwitcherItem value="two" labelText="Option 2" />
  <SwitcherItem value="three" labelText="Option 3" />
  <SwitcherItem value="four" labelText="Option 4" />
</Switcher>
