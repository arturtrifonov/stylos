<script lang="ts">
  import "./radio-input.css";
  import { radioBehavior } from "../../behaviors/radio.ts";
  import type { RadioInputProps } from "./props.ts";

  let {
    size = "extra small", state = "default", isChecked = $bindable("false"),
    id, name = "", value = "on", form = "", accessibleName = "", labelIds = "",
    descriptionIds = "", isRequired = false,
  }: RadioInputProps = $props();
</script>

<span class="stylos-radio-input" data-size={size} data-state={state} data-is-checked={isChecked}>
  <input
    type="radio"
    {id}
    name={name || undefined}
    {value}
    form={form || undefined}
    disabled={state === "disabled"}
    required={isRequired}
    aria-label={labelIds ? undefined : accessibleName || undefined}
    aria-labelledby={labelIds || undefined}
    aria-describedby={descriptionIds || undefined}
    checked={isChecked === "true"}
    use:radioBehavior={{ isChecked, name, form, onChange: (selection) => { isChecked = selection; } }}
  />
</span>
