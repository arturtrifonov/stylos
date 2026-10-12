<script lang="ts">
  import { Modal, Drawer, Button, InputText, Select, DropdownItemDefault } from "@stylos/ui";
  import type { ModalProps } from "@stylos/ui";
  let { kind = "modal", size = "medium" }: { kind?: "modal" | "drawer"; size?: ModalProps["size"] } = $props();
  let open = $state(false);
  let confirm = $state(false);
  let name = $state("Design workspace");
  let plan = $state("team");
  let saved = $state("");
  const fields = ["Owner", "Cost centre", "Department", "Region", "Project code", "Contact", "Billing email", "Address", "Notes"];
  function save() { saved = `${name} — ${plan}`; open = false; confirm = false; }
</script>

<Button labelText="Edit workspace" onclick={() => { open = true; }} />
<InputText labelText="Find workspace" hasPlaceholder placeholderText="Search the page" />
{#if saved}<p>{saved}</p>{/if}
{#snippet content()}
  <InputText {size} labelText="Workspace name" bind:value={name} />
  <Select {size} labelText="Plan" bind:value={plan}>
    <DropdownItemDefault value="starter" labelText="Starter" />
    <DropdownItemDefault value="team" labelText="Team" />
    <DropdownItemDefault value="enterprise" labelText="Enterprise" />
  </Select>
  {#if kind === "drawer"}
    {#each fields as field}<InputText {size} labelText={field} />{/each}
    <Modal bind:isOpen={confirm} size="extra small" headingText="Save workspace?" onprimaryclick={save}>
      <p class="stylos-text-base-extra-small" style:margin="0">Apply changes to {name}.</p>
    </Modal>
  {/if}
{/snippet}
{#if kind === "modal"}
  <Modal {size} bind:isOpen={open} headingText="Edit workspace" primaryButtonText="Save" children={content} onprimaryclick={save} />
{:else}
  <Drawer {size} bind:isOpen={open} headingText="Edit workspace" primaryButtonText="Save" children={content} onprimaryclick={() => { confirm = true; }} />
{/if}
