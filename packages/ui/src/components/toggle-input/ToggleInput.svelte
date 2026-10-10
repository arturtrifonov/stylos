<script lang="ts">
  import "./toggle-input.css";
  import { checkboxBehavior } from "../../behaviors/checkbox.ts";
  import type { ToggleInputProps } from "./props.ts";

  let {
    size = "extra small", state = "default", isChecked = $bindable("false"),
    id, name = "", value = "on", form = "", accessibleName = "",
    descriptionIds = "", isRequired = false,
  }: ToggleInputProps = $props();
</script>

<span class="stylos-toggle-input" data-size={size} data-state={state} data-is-checked={isChecked}>
  <input
    type="checkbox"
    role="switch"
    {id}
    name={name || undefined}
    {value}
    form={form || undefined}
    disabled={state === "disabled"}
    required={isRequired}
    aria-label={accessibleName || undefined}
    aria-describedby={descriptionIds || undefined}
    checked={isChecked === "true"}
    use:checkboxBehavior={{ isChecked, onChange: (selection) => { isChecked = selection === "true" ? "true" : "false"; } }}
  />
  <span class="stylos-toggle-input-surface" aria-hidden="true"></span>
</span>
