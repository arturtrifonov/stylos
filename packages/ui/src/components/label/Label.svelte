<script lang="ts">
  // Label — docs/components/registry/label.yaml. The wrapper takes the
  // contract's props and writes the data attributes label.css reads; it is
  // the only Svelte-specific file in the component (ADR 0002).
  //
  // The supporting line exists when validation has something to say or
  // `has additional text` asks for it — a label with validation is a label
  // with a message, so any value but "off" brings the line with it and the
  // boolean has nothing left to decide. The marker renders whenever
  // `is required`; hiding it under state=disabled is the CSS's rule, so
  // hand-written HTML obeys it too. The marker is aria-hidden because it is
  // a convention, not the requiredness: associating the label with its
  // control, marking the control required and tying the message to it are
  // the consumer's obligations (the entry's `requires` findings).
  import "./label.css";
  import type { LabelProps } from "./props.ts";

  let {
    labelText = "Label",
    isRequired = false,
    hasAdditionalText = false,
    additionalText = "Additional text",
    size = "medium",
    state = "default",
    validation = "off",
  }: LabelProps = $props();

  const showsAdditional = $derived(validation !== "off" || hasAdditionalText);
</script>

<!-- svelte-ignore a11y_label_has_associated_control -- the association is the
  consumer's obligation by contract: a form wraps the control or points `for`
  at it, and the entry's first `requires` finding says a label placed without
  that association is decoration. -->
<label
  class="stylos-label"
  data-size={size}
  data-state={state}
  data-validation={validation}
  data-is-required={isRequired}
  data-has-additional-text={hasAdditionalText}
>{labelText}{#if isRequired}<span aria-hidden="true">{" "}*</span>{/if}{#if showsAdditional}<span>{additionalText}</span>{/if}</label>
