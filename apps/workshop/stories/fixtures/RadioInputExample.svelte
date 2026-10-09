<script lang="ts">
  import { RadioInput } from "@stylos/ui";
  import type { RadioInputProps } from "@stylos/ui";
  let args: RadioInputProps = $props();
</script>

<RadioInput {...args} accessibleName={args.accessibleName || "Select option"} />
