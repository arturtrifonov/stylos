<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/TagIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Tag",
    component: Example,
    args: {
      variant: "fill",
      labelText: "Tag", size: "medium", tone: "base", textCase: "uppercase",
      hasLeadingIcon: true, hasTrailingIcon: true,
      leadingIconName: "check", trailingIconName: "arrow_forward",
    },
    argTypes: {
      variant: { control: "inline-radio", options: ["fill","outline"] },
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      tone: { control: "inline-radio", options: ["base", "primary", "warning", "danger", "success"] },
      textCase: { control: "inline-radio", options: ["uppercase", "original"] },
      labelText: { control: "text" },
      hasLeadingIcon: { control: "boolean" },
      hasTrailingIcon: { control: "boolean" },
      leadingIconName: { control: "select", options: Object.keys(icons) },
      trailingIconName: { control: "select", options: Object.keys(icons) },
    },
  });
</script>

<Story name="Icons playground" />
