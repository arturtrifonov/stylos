<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/DropdownNavigationExample.svelte";
  const { Story } = defineMeta({
    title: "Components/Dropdown", component: Example,
    args: { size: "medium", hasAdditionalText: false },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      hasAdditionalText: { control: "boolean" },
    },
  });
</script>

<Story name="Nested navigation" />
