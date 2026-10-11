<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Example from "./fixtures/SelectForm.svelte";
  const { Story } = defineMeta({ title: "Components/Select", component: Example });
</script>
<Story name="Form" />
