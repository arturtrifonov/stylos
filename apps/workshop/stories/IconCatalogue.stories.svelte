<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/IconCatalogue.svelte";

  const { Story } = defineMeta({
    id: "components-icon", title: "Components/Icon/Icon",
    component: Example,
    args: { name: "rocket_launch" },
    argTypes: {
      name: { control: "select", options: ["rocket_launch", "delete_forever", "thumb_up"] },
    },
  });
</script>

<Story name="Registered from the catalogue" />
