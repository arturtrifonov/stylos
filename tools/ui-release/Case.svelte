<script>
  import * as UI from "@stylos/ui";
  import NativeControls from "./NativeControls.svelte";
  import WindowForm from "../../apps/workshop/stories/fixtures/WindowForm.svelte";
  import SelectForm from "../../apps/workshop/stories/fixtures/SelectForm.svelte";
  // Use the same configured examples as the Default workshop playgrounds.
  const fixtures = import.meta.glob("../../apps/workshop/stories/fixtures/*Example.svelte", { eager: true, import: "default" });
  let { name, args } = $props();
  const Component = $derived(fixtures[`../../apps/workshop/stories/fixtures/${name}Example.svelte`] ?? UI[name]);
</script>

{#snippet content()}Acceptance sample{/snippet}
{#if name === "NativeControls"}
  <NativeControls />
{:else if ["ModalForm", "DrawerForm"].includes(name)}
  <WindowForm kind={name === "ModalForm" ? "modal" : "drawer"} />
{:else if name === "SelectForm"}
  <SelectForm />
{:else if ["CheckboxText", "RadioText", "ToggleText"].includes(name)}
  <Component {...args} children={content} />
{:else if name === "Icon"}
  <Component {...args} name="add" />
{:else}
  <Component {...args} />
{/if}
