<script module lang="ts">
  import { fn } from "storybook/test";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/ButtonIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const iconNames = Object.keys(icons);
  const { Story } = defineMeta({
    title: "Components/Button",
    component: Example,
    args: {
      variant: "base",
      labelText: "Continue",
      size: "medium",
      tone: "primary",
      state: "default",
      hasLeadingIcon: true,
      hasTrailingIcon: true,
      leadingIconName: "add",
      trailingIconName: "arrow_forward",
      onclick: fn(),
    },
    argTypes: {
      onclick: { control: false },
      variant: { control: "inline-radio", options: ["base","outline","ghost"] },
      size: {
        control: "inline-radio",
        options: ["extra small", "small", "medium", "large", "extra large"],
      },
      tone: {
        control: "inline-radio",
        options: ["primary", "base", "success", "warning", "danger"],
      },
      state: { control: "inline-radio", options: ["default", "disabled"] },
      labelText: { control: "text" },
      hasLeadingIcon: { control: "boolean" },
      hasTrailingIcon: { control: "boolean" },
      leadingIconName: { control: "select", options: iconNames },
      trailingIconName: { control: "select", options: iconNames },
    },
  });
</script>

<Story name="Icons playground" />
