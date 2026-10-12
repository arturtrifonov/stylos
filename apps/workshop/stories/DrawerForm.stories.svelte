<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/WindowForm.svelte";
  const { Story } = defineMeta({
    id: "components-drawer", title: "Components/Drawer/Drawer", component: Example,
    args: { kind: "drawer", size: "medium" },
    argTypes: { kind: { control: false }, size: { control: "inline-radio", options: ["extra small", "small", "medium", "large", "extra large"] } },
  });
</script>
<Story name="Form" />
