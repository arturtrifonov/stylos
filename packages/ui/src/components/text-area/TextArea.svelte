<script lang="ts">
  import { untrack } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import "./text-area.css";
  import Label from "../label/Label.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { TextAreaProps } from "./props.ts";
  import { nativeLengthLimit, textAreaCounter } from "../../behaviors/text-area.ts";
  import { inputTextBehavior } from "../../behaviors/input-text.ts";

  let {
    size = "medium", state = "default", validation = "off",
    value = $bindable(""), hasLabel = true, labelText = "Label",
    hasAdditionalText = false, additionalText = "Additional text",
    hasPlaceholder = false, placeholderText = "Placeholder text",
    hasLeadingIcon = false, leadingIcon, hasTrailingIcon = false, trailingIcon,
    hasCounterText = false, counterText, maxlength, minlength, isRequired = false,
    id, name, form, autocomplete, accessibleName, labelIds, descriptionIds,
    oninput, onchange,
  }: TextAreaProps = $props();

  const maxLength = $derived(nativeLengthLimit(maxlength));
  const minLength = $derived(nativeLengthLimit(minlength));
  const counter = $derived(textAreaCounter(value, maxLength, counterText));
  const instanceId = $props.id();
  const initialValue = untrack(() => value);
  const controlId = $derived(id ?? `text-area-${instanceId}`);
  const messageId = $derived(`${controlId}-message`);
  const counterId = $derived(`${controlId}-counter`);
  const outcome = $derived(state === "default" ? validation : "off");
  const labelOutcome = $derived(outcome === "error" || outcome === "warning" ? outcome : "off");
  const showsMessage = $derived(labelOutcome !== "off" || hasAdditionalText);
  const describedBy = $derived([
    descriptionIds, showsMessage ? messageId : undefined,
    hasCounterText && counter ? counterId : undefined,
  ].filter(Boolean).join(" ") || undefined);
  const validationIcon = $derived({ error: "error", warning: "warning", success: "check_circle", off: "" }[outcome]);

  function measureAdornments(parts: boolean[]) {
    return parts.some(Boolean)
      ? (field: HTMLElement) => inputTextBehavior(field).destroy
      : undefined;
  }
</script>

<div
  class="stylos-text-area"
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
  <div class="stylos-text-area-field" data-surface-layer="1" data-surface-attachment="in-layout" {@attach measureAdornments([hasLeadingIcon && !!leadingIcon, hasTrailingIcon && !!trailingIcon])}>
    <textarea
      class="stylos-scrollbar" data-scrollbar-size="small" data-scrollbar-position="absolute"
      maxlength={maxLength} minlength={minLength}
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
    ></textarea>
    {#if hasLeadingIcon && leadingIcon}<span class="stylos-text-area-leading" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>{/if}
    {#if hasTrailingIcon && trailingIcon}
      <span class="stylos-text-area-trailing stylos-text-area-icon" data-position="trailing" aria-hidden="true">{@render trailingIcon()}</span>
    {/if}
    {#if outcome !== "off"}<span class="stylos-text-area-validation" aria-hidden="true"><Icon name={validationIcon} /></span>{/if}
  </div>
  {#if hasCounterText}<span class="stylos-text-area-counter" id={counterId}>{counter}</span>{/if}
</div>
