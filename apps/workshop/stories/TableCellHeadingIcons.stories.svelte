<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/TableCellHeadingIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";
  const { Story } = defineMeta({
    id: "components-table-cell-heading", title: "Components/Table Cell/Table Cell Heading", component: Example,
    args: { size: "medium", alignment: "start", hasIcon: true, iconName: "home", cellText: "Workspace", hasAdditionalText: false, additionalText: "Team workspace" },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      alignment: { control: "inline-radio", options: ["start", "end"] },
      hasIcon: { control: "boolean" }, iconName: { control: "select", options: Object.keys(icons) },
      cellText: { control: "text" }, hasAdditionalText: { control: "boolean" }, additionalText: { control: "text" },
    },
  });
</script>
<Story name="Icons playground" />
