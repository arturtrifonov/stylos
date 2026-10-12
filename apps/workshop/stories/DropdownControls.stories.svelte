<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/DropdownControlsExample.svelte";
  const { Story } = defineMeta({
    id: "components-dropdown", title: "Components/Dropdown/Dropdown", component: Example,
    args: { size: "medium", maxHeight: "", alignment: "start", hasAdditionalText: false },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      maxHeight: { control: "text" },
      alignment: { control: "inline-radio", options: ["start", "end"] },
      hasAdditionalText: { control: "boolean" }, kind: { control: false },
    },
  });
</script>

<Story name="Checkbox selection" args={{ kind: "checkbox" }} />
<Story name="Toggle settings" args={{ kind: "toggle" }} />
