<script lang="ts">
  import { ToggleInput } from "@stylos/ui";
  import type { ToggleInputProps } from "@stylos/ui";
  let args: ToggleInputProps = $props();
</script>

<ToggleInput {...args} accessibleName={args.accessibleName || "Notifications"} />
