<script lang="ts">
  import { CheckboxInput } from "@stylos/ui";
  import type { CheckboxInputProps } from "@stylos/ui";
  let args: CheckboxInputProps = $props();
</script>

<CheckboxInput {...args} accessibleName={args.accessibleName || "Select row"} />
