<script lang="ts">
  import "./checkbox-input.css";
  import { checkboxBehavior } from "../../behaviors/checkbox.ts";
  import type { CheckboxInputProps } from "./props.ts";

  let {
    size = "medium", state = "default", isChecked = $bindable("false"),
    id, name = "", value = "on", form = "", accessibleName = "",
    descriptionIds = "", isRequired = false,
  }: CheckboxInputProps = $props();
</script>

<span class="stylos-checkbox-input" data-size={size} data-state={state} data-is-checked={isChecked}>
  <input
    type="checkbox"
    {id}
    name={name || undefined}
    {value}
    form={form || undefined}
    disabled={state === "disabled"}
    required={isRequired}
    aria-label={accessibleName || undefined}
    aria-describedby={descriptionIds || undefined}
    checked={isChecked === "true"}
    use:checkboxBehavior={{ isChecked, onChange: (selection) => { isChecked = selection; } }}
  />
  <span class="stylos-checkbox-input-surface" aria-hidden="true"></span>
</span>
