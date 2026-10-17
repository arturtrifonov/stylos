<script lang="ts">
  import { Accordion, InputText } from "@stylos/ui";
  import type { AccordionProps } from "@stylos/ui";
  let args: AccordionProps = $props();
</script>
<Accordion {...args}><InputText labelText="Workspace name" value="Design workspace" /></Accordion>
