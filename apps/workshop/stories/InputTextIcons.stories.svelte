<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/InputTextIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Input Text",
    component: Example,
    args: {
      size: "medium", state: "default", validation: "off", value: "",
      hasLabel: true, labelText: "Label", hasLeadingIcon: true, hasTrailingIcon: true,
      hasPlaceholder: true, placeholderText: "Placeholder text",
      leadingIconName: "person", trailingIconName: "search",
    },
    argTypes: {
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      state: { control: "inline-radio", options: ["default", "read only", "disabled"] },
      validation: { control: "inline-radio", options: ["off", "error", "warning", "success"] },
      value: { control: "text" },
      hasLabel: { control: "boolean" },
      labelText: { control: "text" },
      hasAdditionalText: { control: "boolean" },
      additionalText: { control: "text" },
      hasPlaceholder: { control: "boolean" },
      placeholderText: { control: "text" },
      hasSuffixText: { control: "boolean" },
      suffixText: { control: "text" },
      isRequired: { control: "boolean" },
      hasLeadingIcon: { control: "boolean" },
      hasTrailingIcon: { control: "boolean" },
      leadingIconName: { control: "select", options: Object.keys(icons) },
      trailingIconName: { control: "select", options: Object.keys(icons) },
    },
  });
</script>

<Story name="Icons playground" />
