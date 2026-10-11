<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/SelectIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Select", component: Example,
    args: { size: "medium", state: "default", validation: "off", value: "design",
      labelText: "Workspace", hasLeadingIcon: true, leadingIconName: "person", hasClearButton: true },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      state: { control: "inline-radio", options: ["default", "read only", "disabled"] },
      validation: { control: "inline-radio", options: ["off", "error", "warning", "success"] },
      value: { control: "select", options: ["", "design", "development", "marketing", "operations", "support", "finance", "legal"] },
      labelText: { control: "text" }, hasLabel: { control: "boolean" },
      hasAdditionalText: { control: "boolean" }, additionalText: { control: "text" },
      hasPlaceholder: { control: "boolean" }, placeholderText: { control: "text" },
      hasSuffixText: { control: "boolean" }, suffixText: { control: "text" },
      isRequired: { control: "boolean" }, hasClearButton: { control: "boolean" },
      hasLeadingIcon: { control: "boolean" },
      leadingIconName: { control: "select", options: Object.keys(icons) },
    },
  });
</script>

<Story name="Icons playground" />
