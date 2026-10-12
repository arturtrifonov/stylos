<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/SelectForm.svelte";
  const { Story } = defineMeta({ id: "components-select", title: "Components/Select/Select", component: Example });
</script>
<Story name="Form" />
