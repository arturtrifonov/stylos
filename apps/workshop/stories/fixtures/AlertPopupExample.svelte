<script lang="ts">
  import { AlertPopup, Icon } from "@stylos/ui";
  import type { AlertPopupProps } from "@stylos/ui";
  let args: AlertPopupProps = $props();
</script>
{#snippet mark()}<Icon name="schedule" />{/snippet}
<AlertPopup {...args} icon={mark}>Comment or other text of the notification with non-blocking information</AlertPopup>
