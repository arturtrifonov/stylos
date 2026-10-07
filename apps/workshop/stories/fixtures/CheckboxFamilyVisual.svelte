<script lang="ts">
  import "@stylos/ui/css/checkbox-label.css";
  import "@stylos/ui/css/checkbox-text.css";
  let { kind = "label" }: {kind?: "label" | "text"} = $props();
  const sizes = ["extra small", "small", "medium", "large", "extra large"];
  const states = ["default", "hover", "active", "disabled"];
  const selections = ["false", "true", "mixed"];
</script>
<div class="family-visual">
  {#each sizes as size}
    <div class="family-column">
      {#each selections as selection}
        {#each states as state}
          <span class="stylos-checkbox-{kind}" data-size={size} data-state={state} data-is-checked={selection}>
            <span class="stylos-checkbox-input" data-size={size} data-state={state} data-is-checked={selection} aria-hidden="true"><span class="stylos-checkbox-input-surface"></span></span>
            <span class="stylos-checkbox-copy">Checkbox</span>
          </span>
        {/each}
      {/each}
    </div>
  {/each}
</div>
<style>
  .family-visual { display: flex; gap: var(--stylos-dimension-gap-g-3_000); }
  .family-column { display: grid; align-content: start; gap: var(--stylos-dimension-gap-g-2_000); width: 210px; }
</style>
