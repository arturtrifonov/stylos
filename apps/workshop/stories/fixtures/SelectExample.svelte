<script lang="ts">
  import { Select, DropdownItemDefault } from "@stylos/ui";
  import type { SelectProps } from "@stylos/ui";
  let args: SelectProps = $props();
</script>

<div style:width="320px">
  <Select {...args}>
    <DropdownItemDefault value="design" labelText="Design" />
    <DropdownItemDefault value="development" labelText="Development" />
    <DropdownItemDefault value="marketing" labelText="Marketing" />
    <DropdownItemDefault value="research" labelText="Research" state="disabled" />
    <DropdownItemDefault value="operations" labelText="Operations" />
    <DropdownItemDefault value="support" labelText="Support" />
    <DropdownItemDefault value="finance" labelText="Finance" />
    <DropdownItemDefault value="legal" labelText="Legal" />
  </Select>
</div>
