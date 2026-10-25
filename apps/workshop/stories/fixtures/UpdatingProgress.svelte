<script lang="ts">
  import { Button, ProgressBar } from "@stylos/ui";
  let value = $state("unknown");
</script>

<div class="updating-progress">
  <ProgressBar {value} accessibleName="Workspace import" />
  <div class="progress-controls">
    <Button size="extra small" labelText="37.5%" onclick={() => value = "37.5%"} />
    <Button size="extra small" labelText="Unknown" onclick={() => value = "unknown"} />
    <Button size="extra small" labelText="Complete" onclick={() => value = "100"} />
  </div>
</div>

<style>
  .updating-progress { display: grid; gap: 24px; max-width: 320px; padding-block: 8px; }
  .progress-controls { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
