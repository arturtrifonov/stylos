<script module lang="ts">
  import { fn } from "storybook/test";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/ButtonIconIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Button Icon",
    component: Example,
    args: {
      variant: "base", tone: "primary", size: "medium", state: "default",
      iconName: "add", accessibleName: "Add item", onclick: fn(),
    },
    argTypes: {
      variant: { control: "inline-radio", options: ["base", "outline", "ghost"] },
      tone: { control: "inline-radio", options: ["base", "primary", "warning", "danger", "success"] },
      size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] },
      state: { control: "inline-radio", options: ["default", "disabled"] },
      iconName: { control: "select", options: Object.keys(icons) },
      accessibleName: { control: "text" },
      onclick: { control: false },
    },
  });
</script>

<Story name="Icons playground" />
