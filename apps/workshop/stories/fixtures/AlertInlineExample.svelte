<script lang="ts">
  import { AlertInline, Icon } from "@stylos/ui";
  import type { AlertInlineProps } from "@stylos/ui";
  let args: AlertInlineProps = $props();
</script>
{#snippet mark()}<Icon name="schedule" />{/snippet}
<AlertInline {...args} icon={mark}>Comment or other text of the notification with non-blocking information</AlertInline>
