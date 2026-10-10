<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/ButtonInnerIcons.svelte";
  import { icons } from "../../../packages/ui/src/components/icon/icons.ts";

  const { Story } = defineMeta({
    title: "Components/Button Inner",
    component: Example,
    args: { iconName: "close", accessibleName: "Clear field", state: "default" },
    argTypes: {
      iconName: { control: "select", options: Object.keys(icons) },
      accessibleName: { control: "text" },
      state: { control: "inline-radio", options: ["default", "disabled"] },
    },
  });
</script>

<Story name="Icons playground" />
