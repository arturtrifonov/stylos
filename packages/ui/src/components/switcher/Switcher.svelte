<script lang="ts">
  import { setContext, untrack } from "svelte";
  import { switcherContext, type SelectionContext } from "../../internal/selection-context.ts";
  import { switcherBehavior } from "../../behaviors/switcher.ts";
  import "./switcher.css";
  import type { SwitcherProps } from "./props.ts";
  let { size = "medium", tone = "base", state = "default", value = $bindable(""),
    accessibleName = "Options", children, name, form, onchange }: SwitcherProps = $props();
  const instanceId = $props.id();
  const initialValue = untrack(() => value);
  setContext<SelectionContext>(switcherContext, { value: () => value, size: () => size, tone: () => tone,
    name: () => name ?? `switcher-${instanceId}`, form: () => form, initialValue,
    select: (next, event) => { if (next !== value) { value = next; onchange?.(event); } } });
</script>

<fieldset class="stylos-switcher" data-size={size} data-tone={tone} data-state={state}
  aria-label={accessibleName} disabled={state === "disabled"} use:switcherBehavior={{ reset: () => { value = initialValue; } }}>
  {@render children?.()}
</fieldset>
