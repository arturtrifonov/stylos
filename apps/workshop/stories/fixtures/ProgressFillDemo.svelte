<script lang="ts">
  import { Button, ProgressBar } from "@stylos/ui";

  let value = $state(0);
  let running = $state(false);
  let seconds = $state<number | undefined>(5);

  // This fixture is the external producer. ProgressBar only receives values.
  $effect(() => {
    if (!running) return;
    const duration = Math.max(0.1, seconds || 5) * 1000;
    let previous = performance.now();
    let frame: number;
    function advance(now: number) {
      value = Math.min(100, value + (now - previous) / duration * 100);
      previous = now;
      if (value < 100) frame = requestAnimationFrame(advance);
      else running = false;
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  });

  function start() {
    if (value >= 100) value = 0;
    running = true;
  }

  function reset() {
    running = false;
    value = 0;
  }
</script>

<div class="progress-fill-demo">
  <label class="simulation-duration">
    Simulation duration (seconds)
    <input type="number" min="0.1" step="0.5" bind:value={seconds} disabled={running} />
  </label>
  <ProgressBar value={String(value)} labelText={`${Math.round(value)}%`} labelWidth="5ch" accessibleName="Simulated progress" />
  <div class="progress-demo-controls">
    <Button size="extra small" labelText="Start" onclick={start} state={running ? "disabled" : "default"} />
    <Button size="extra small" labelText="Pause" onclick={() => running = false} state={running ? "default" : "disabled"} />
    <Button size="extra small" labelText="Reset" onclick={reset} />
  </div>
  <ProgressBar value="unknown" labelText="Unknown" accessibleName="Indeterminate progress" />
</div>

<style>
  .progress-fill-demo { display: grid; gap: 24px; max-width: 400px; padding-block: 8px; font-family: var(--stylos-font-family-normal); }
  .simulation-duration { display: grid; gap: 8px; justify-items: start; }
  .simulation-duration input { font: inherit; }
  .progress-demo-controls { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
