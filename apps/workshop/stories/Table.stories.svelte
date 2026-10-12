<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/TableExample.svelte";
  const { Story } = defineMeta({
    id: "components-table-row-body", title: "Components/Table/Table Row Body", component: Example,
    args: { size: "medium", hasBackground: true, hasDivider: false, hasAdditionalText: false },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      hasBackground: { control: "boolean" }, hasDivider: { control: "boolean" }, hasAdditionalText: { control: "boolean" },
    },
  });
</script>

<Story name="Table" />
