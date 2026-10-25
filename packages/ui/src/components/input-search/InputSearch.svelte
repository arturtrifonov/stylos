<script lang="ts">
  import { untrack } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import "./input-search.css";
  import Label from "../label/Label.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { InputSearchProps } from "./props.ts";
  import { inputTextBehavior } from "../../behaviors/input-text.ts";
  import { clearSearchInput } from "../../behaviors/input-search.ts";
  import ButtonInner from "../button-inner/ButtonInner.svelte";

  let {
    size = "medium", state = "default", validation = "off",
    value = $bindable(""), hasLabel = true, labelText = "Label",
    hasAdditionalText = false, additionalText = "Additional text",
    hasPlaceholder = false, placeholderText = "Placeholder text",
    hasLeadingIcon = false, leadingIcon, clearAccessibleName,
    hasSuffixText = false, suffixText = "Suffix", isRequired = false,
    id, name, form, autocomplete, accessibleName, labelIds, descriptionIds,
    oninput, onchange,
  }: InputSearchProps = $props();

  let input: HTMLInputElement;
  const instanceId = $props.id();
  const initialValue = untrack(() => value);
  const controlId = $derived(id ?? `input-search-${instanceId}`);
  const messageId = $derived(`${controlId}-message`);
  const suffixId = $derived(`${controlId}-suffix`);
  const outcome = $derived(state === "default" ? validation : "off");
  const labelOutcome = $derived(outcome === "error" || outcome === "warning" ? outcome : "off");
  const showsMessage = $derived(labelOutcome !== "off" || hasAdditionalText);
  const describedBy = $derived([
    descriptionIds, showsMessage ? messageId : undefined,
    hasSuffixText && suffixText ? suffixId : undefined,
  ].filter(Boolean).join(" ") || undefined);
  const validationIcon = $derived({ error: "error", warning: "warning", success: "check_circle", off: "" }[outcome]);

  const showsClear = $derived(value !== "" && state === "default");
  const clearName = $derived(clearAccessibleName || `Clear ${hasLabel ? labelText : accessibleName || "search"}`);

  // Attach after optional groups mount and release measurements when they leave.
  // Search always has a trailing group; it measures changes including clear.
  function measureAdornments(parts: boolean[]) {
    return parts.some(Boolean)
      ? (field: HTMLElement) => inputTextBehavior(field).destroy
      : undefined;
  }
</script>

{#snippet clearIcon()}<Icon name="close" />{/snippet}

<div
  class="stylos-input-search"
  data-size={size}
  data-state={state}
  data-validation={outcome}
  data-is-filled={value !== ""}
  data-has-placeholder={hasPlaceholder}
>
  {#if hasLabel}
    <Label
      {size} {labelText} {hasAdditionalText} {additionalText} {isRequired}
      state={state === "disabled" ? "disabled" : "default"}
      validation={labelOutcome}
      htmlFor={controlId}
      additionalTextId={messageId}
    />
  {:else if showsMessage}
    <span id={messageId} hidden>{additionalText}</span>
  {/if}
  <div class="stylos-input-search-field" data-surface-layer="1" data-surface-attachment="in-layout"
    {@attach measureAdornments([hasLeadingIcon && !!leadingIcon, true])}>
    <input
      bind:this={input}
      type="search"
      id={controlId}
      {name} {form}
      autocomplete={autocomplete as HTMLInputAttributes["autocomplete"]}
      bind:value
      defaultValue={initialValue}
      placeholder={hasPlaceholder ? placeholderText : undefined}
      disabled={state === "disabled"}
      readonly={state === "read only"}
      required={isRequired}
      aria-label={hasLabel ? labelText : accessibleName}
      aria-labelledby={hasLabel ? undefined : labelIds}
      aria-describedby={describedBy}
      aria-invalid={outcome === "error" ? "true" : undefined}
      {oninput} {onchange}
    />
    {#if hasLeadingIcon && leadingIcon}<span class="stylos-input-search-leading" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>{/if}
    <span class="stylos-input-search-trailing">
      {#if hasSuffixText}<span class="stylos-input-search-suffix" id={suffixId}>{suffixText}</span>{/if}
      {#if showsClear}<ButtonInner accessibleName={clearName} icon={clearIcon} onclick={() => clearSearchInput(input)} />{/if}
      {#if outcome !== "off"}<span class="stylos-input-search-validation" aria-hidden="true"><Icon name={validationIcon} /></span>{/if}
      <Icon name="search" />
    </span>
  </div>
</div>
