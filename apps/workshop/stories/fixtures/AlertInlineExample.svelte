<script lang="ts">
  import { AlertInline, Icon } from "@stylos/ui";
  import type { AlertInlineProps } from "@stylos/ui";
  let args: AlertInlineProps = $props();
</script>
{#snippet mark()}<Icon name={args.type === "warning" ? "warning" : args.type === "danger" ? "error" : args.type === "success" ? "check_circle" : "schedule"} />{/snippet}
<AlertInline {...args} icon={mark}>Comment or other text of the notification with non-blocking information</AlertInline>
