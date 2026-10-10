<script lang="ts">
  import { untrack } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import "./input-text.css";
  import Label from "../label/Label.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { InputTextProps } from "./props.ts";
  import { inputTextBehavior } from "../../behaviors/input-text.ts";

  let {
    size = "medium", state = "default", validation = "off",
    value = $bindable(""), hasLabel = true, labelText = "Label",
    hasAdditionalText = false, additionalText = "Additional text",
    hasPlaceholder = false, placeholderText = "Placeholder text",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    hasSuffixText = false, suffixText = "Suffix", isRequired = false,
    id, name, form, autocomplete, accessibleName, labelIds, descriptionIds,
    oninput, onchange,
  }: InputTextProps = $props();

  const instanceId = $props.id();
  const initialValue = untrack(() => value);
  const controlId = $derived(id ?? `input-text-${instanceId}`);
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
</script>

<div
  class="stylos-input-text"
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
  <div class="stylos-input-text-field" use:inputTextBehavior>
    <input
      type="text"
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
    <div class="stylos-input-text-adornments">
      <span class="stylos-input-text-leading">{#if hasLeadingIcon && leadingIcon}<span class="stylos-input-text-icon" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>{/if}</span>
      <span class="stylos-input-text-trailing">{#if hasSuffixText}<span class="stylos-input-text-suffix" id={suffixId}>{suffixText}</span>{/if}{#if outcome !== "off"}<span class="stylos-input-text-validation" aria-hidden="true"><Icon name={validationIcon} /></span>{/if}{#if hasTrailingIcon && trailingIcon}<span class="stylos-input-text-icon" data-position="trailing" aria-hidden="true">{@render trailingIcon()}</span>{/if}</span>
    </div>
  </div>
</div>
