<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/DropdownItemParentIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";
  const { Story } = defineMeta({
    id: "components-dropdown-item-parent", title: "Components/Dropdown/Dropdown Item Parent", component: Example,
    args: { size: "medium", state: "default", hasIcon: true, iconName: "home",
      labelText: "Workspace", hasAdditionalText: false, additionalText: "Team workspace" },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      state: { control: "inline-radio", options: ["default", "disabled"] },
      hasIcon: { control: "boolean" }, iconName: { control: "select", options: Object.keys(icons) },
      labelText: { control: "text" }, hasAdditionalText: { control: "boolean" }, additionalText: { control: "text" },
    },
  });
</script>

<Story name="Icons playground" />
