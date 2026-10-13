<script>
  import * as UI from "@stylos/ui";
  import NativeControls from "./NativeControls.svelte";
  import WindowForm from "../../apps/workshop/stories/fixtures/WindowForm.svelte";
  import SelectForm from "../../apps/workshop/stories/fixtures/SelectForm.svelte";
  // Use the same configured examples as the Default workshop playgrounds.
  const fixtures = import.meta.glob("../../apps/workshop/stories/fixtures/*Example.svelte", { eager: true, import: "default" });
  let { name, args } = $props();
  const Component = $derived(fixtures[`../../apps/workshop/stories/fixtures/${name}Example.svelte`] ?? UI[name]);
  const Row = $derived(UI[name]);
</script>

{#snippet content()}Acceptance sample{/snippet}
{#if name === "NativeControls"}
  <NativeControls />
{:else if ["ModalForm", "DrawerForm"].includes(name)}
  <WindowForm kind={name === "ModalForm" ? "modal" : "drawer"} />
{:else if name === "SelectForm"}
  <SelectForm />
{:else if name === "TableCellHeading"}
  <table><caption>Acceptance table</caption><thead><UI.TableRowHead size={args.size ?? "medium"}>
    <Row {...args}>{#snippet icon()}<UI.Icon name="add" />{/snippet}</Row>
  </UI.TableRowHead></thead><tbody><UI.TableRowBody size={args.size ?? "medium"}><UI.TableCellText cellText="Example" /></UI.TableRowBody></tbody></table>
{:else if name === "TableRowHead"}
  <table><caption>Acceptance table</caption><thead><Row {...args}><UI.TableCellHeading cellText="Name" /></Row></thead>
    <tbody><UI.TableRowBody><UI.TableCellText cellText="Example" /></UI.TableRowBody></tbody></table>
{:else if name === "TableRowBody"}
  <table><caption>Acceptance table</caption><thead><UI.TableRowHead><UI.TableCellHeading cellText="Name" /></UI.TableRowHead></thead>
    <tbody><Row {...args}><UI.TableCellText cellText="Example" /></Row></tbody></table>
{:else if ["CheckboxText", "RadioText", "ToggleText"].includes(name)}
  <Component {...args} children={content} />
{:else if name === "Icon"}
  <Component {...args} name="add" />
{:else}
  <Component {...args} />
{/if}
