<script lang="ts">
  import { untrack } from "svelte";
  import "./select.css";
  import Label from "../label/Label.svelte";
  import Icon from "../icon/Icon.svelte";
  import ButtonInner from "../button-inner/ButtonInner.svelte";
  import Dropdown from "../dropdown/Dropdown.svelte";
  import { inputTextBehavior } from "../../behaviors/input-text.ts";
  import { singleSelectBehavior } from "../../behaviors/single-select.ts";
  import type { SelectProps } from "./props.ts";

  let {
    size = "medium", state: interactionState = "default", validation = "off", value = $bindable(""),
    inputText = "", children, hasLabel = true, labelText = "Label",
    hasAdditionalText = false, additionalText = "Additional text", isRequired = false,
    hasPlaceholder = true, placeholderText = "Select the option",
    hasLeadingIcon = false, leadingIcon, hasSuffixText = false, suffixText = "Suffix",
    hasClearButton = false, clearAccessibleName, maxHeight = "",
    id, name, form, autocomplete, accessibleName, labelIds, descriptionIds,
    oninput, onchange,
  }: SelectProps = $props();

  const instanceId = $props.id();
  const initialValue = untrack(() => value);
  const initialLabel = untrack(() => inputText || value);
  const controlId = $derived(id ?? `select-${instanceId}`);
  const messageId = $derived(`${controlId}-message`);
  const suffixId = $derived(`${controlId}-suffix`);
  let fieldsetDisabled = $state(false);
  const fieldState = $derived(fieldsetDisabled ? "disabled" : interactionState);
  const outcome = $derived(fieldState === "default" ? validation : "off");
  const labelOutcome = $derived(outcome === "error" || outcome === "warning" ? outcome : "off");
  const showsMessage = $derived(labelOutcome !== "off" || hasAdditionalText);
  const fieldName = $derived(hasLabel ? labelText : accessibleName ?? "");
  const describedBy = $derived([descriptionIds, showsMessage ? messageId : undefined,
    hasSuffixText && suffixText ? suffixId : undefined].filter(Boolean).join(" ") || undefined);
  const validationIcon = $derived({ error: "error", warning: "warning", success: "check_circle", off: "" }[outcome]);
  let resolvedLabel = $state("");
  let trigger: HTMLButtonElement;
  const displayText = $derived(value ? resolvedLabel || inputText || value : hasPlaceholder ? placeholderText : "");
  const showsClear = $derived(hasClearButton && !!value && fieldState === "default");

  // As in Input Text: attach after optional groups mount and release
  // measurements when they leave.
  function measureAdornments(parts: boolean[]) {
    return parts.some(Boolean)
      ? (field: HTMLElement) => inputTextBehavior(field).destroy
      : undefined;
  }
</script>

<div class="stylos-select" data-size={size} data-state={fieldState} data-validation={outcome} data-is-filled={value !== ""}
  use:singleSelectBehavior={{ id: controlId, value, accessibleName: fieldName,
    disabled: interactionState === "disabled", readOnly: fieldState === "read only", invalid: outcome === "error",
    required: isRequired, name, form, autocomplete,
    labelIds: hasLabel ? undefined : labelIds, descriptionIds: describedBy,
    onValueChange: next => { value = next; }, onLabelChange: next => { resolvedLabel = next; },
    onDisabledChange: next => { fieldsetDisabled = next; }, oninput, onchange }}>
  {#if hasLabel}
    <Label {size} {labelText} {hasAdditionalText} {additionalText} {isRequired}
      state={fieldState === "disabled" ? "disabled" : "default"} validation={labelOutcome}
      htmlFor={controlId} additionalTextId={messageId} />
  {:else if showsMessage}
    <span id={messageId} hidden>{additionalText}</span>
  {/if}
  <div class="stylos-select-field" data-surface-layer="1" data-surface-attachment="in-layout"
    {@attach measureAdornments([hasLeadingIcon && !!leadingIcon, hasSuffixText, showsClear, outcome !== "off", fieldState === "default"])}>
    <button class="stylos-select-trigger" type="button" id={controlId} bind:this={trigger} data-dropdown-trigger
      role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls={`${controlId}-options`}
      aria-label={fieldName || undefined} aria-labelledby={hasLabel ? undefined : labelIds}
      aria-describedby={describedBy} aria-readonly={fieldState === "read only" || undefined}
      aria-invalid={outcome === "error" || undefined} aria-required={isRequired || undefined}
      disabled={fieldState === "disabled"}><span class="stylos-select-value">{displayText}</span></button>
    <!-- Native form bridge: the adapter mirrors the authored Dropdown options,
      handles autofill and delegates reset/constraint validation to the browser. -->
    <select data-select-native id={`${controlId}-native`} {name} {form} tabindex="-1" aria-hidden="true"
      disabled={fieldState === "disabled"} required={isRequired && fieldState === "default"}>
      <!-- Only the initial option is rendered here. The adapter owns the option
        nodes after hydration; reactive Svelte children would have two owners. -->
      <option value={initialValue}>{initialLabel}</option>
    </select>
    {#if hasLeadingIcon && leadingIcon}<span class="stylos-select-leading" data-position="leading" aria-hidden="true">{@render leadingIcon()}</span>{/if}
    {#if hasSuffixText || showsClear || outcome !== "off" || fieldState === "default"}
      <span class="stylos-select-trailing">{#if hasSuffixText}<span class="stylos-select-suffix" id={suffixId}>{suffixText}</span>{/if}{#if showsClear}<ButtonInner
        accessibleName={clearAccessibleName || `Clear ${fieldName}`}
        onclick={() => { value = ""; trigger.focus({ preventScroll: true }); }}>{#snippet icon()}<Icon name="close" />{/snippet}</ButtonInner>{/if}{#if outcome !== "off"}<span class="stylos-select-validation" aria-hidden="true"><Icon name={validationIcon} /></span>{/if}{#if fieldState === "default"}<Icon name="arrow_drop_down" />{/if}</span>
    {/if}
  </div>
  <div data-dropdown-positioner hidden>
    <Dropdown {size} accessibleName={fieldName} {maxHeight} id={`${controlId}-options`}>
      {#snippet contentSlot()}{#if children}{@render children()}{/if}{/snippet}
    </Dropdown>
  </div>
</div>
