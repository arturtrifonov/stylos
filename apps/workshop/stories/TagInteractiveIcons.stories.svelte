<script module lang="ts">
  import { fn } from "storybook/test";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/TagInteractiveIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Tag Interactive",
    component: Example,
    args: {
      variant: "fill",
      onclick: fn(),
      labelText: "Tag", state: "default", size: "medium", tone: "base", textCase: "uppercase",
      hasLeadingIcon: true, hasTrailingIcon: true,
      leadingIconName: "check", trailingIconName: "arrow_forward",
    },
    argTypes: {
      variant: { control: "inline-radio", options: ["fill","outline"] },
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      tone: { control: "inline-radio", options: ["base", "primary", "warning", "danger", "success"] },
      textCase: { control: "inline-radio", options: ["uppercase", "original"] },
      state: { control: "inline-radio", options: ["default", "disabled"] },
      onclick: { control: false },
      labelText: { control: "text" },
      hasLeadingIcon: { control: "boolean" },
      hasTrailingIcon: { control: "boolean" },
      leadingIconName: { control: "select", options: Object.keys(icons) },
      trailingIconName: { control: "select", options: Object.keys(icons) },
    },
  });
</script>

<Story name="Icons playground" />
