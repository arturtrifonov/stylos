<script lang="ts">
  import type { Component } from "svelte";
  import "./button-ghost.css";
  import type { ButtonGhostProps } from "./props.ts";

  let {
    tone = "primary", size = "medium", state = "default", labelText = "Button",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    type = "button", id, name = "", value = "", form = "", descriptionIds = "", onclick,
  }: ButtonGhostProps = $props();
  // Both components and snippets accept Svelte's render target first. Treat
  // an instance as a component so either kind also renders on the server.
  const LeadingIcon = $derived(leadingIcon as Component | undefined);
  const TrailingIcon = $derived(trailingIcon as Component | undefined);
</script>

<button
  {type}
  {id}
  name={name || undefined}
  {value}
  form={form || undefined}
  aria-describedby={descriptionIds || undefined}
  {onclick}
  class="stylos-button-ghost"
  data-tone={tone}
  data-size={size}
  data-state={state}
  disabled={state === "disabled"}
>
  {#if hasLeadingIcon && LeadingIcon}
    <span class="stylos-button-ghost-icon" data-position="leading" aria-hidden="true"><LeadingIcon /></span>
  {/if}
  <span>{labelText}</span>
  {#if hasTrailingIcon && TrailingIcon}
    <span class="stylos-button-ghost-icon" data-position="trailing" aria-hidden="true"><TrailingIcon /></span>
  {/if}
</button>
