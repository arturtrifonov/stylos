<script lang="ts">
  import { AlertPopupTimer, Button } from "@stylos/ui";
  import type { AlertPopupTimerProps } from "@stylos/ui";

  let args: AlertPopupTimerProps = $props();
  let duration = $state<number | undefined>(3);
  let remaining = $state(3);
  let running = $state(false);
  let open = $state(true);
  let outcome = $state("Ready");

  // This fixture owns elapsed time; the notification only receives seconds.
  $effect(() => {
    const externalDuration = args.duration ?? 3;
    duration = externalDuration;
    const limit = Number.isFinite(externalDuration) ? Math.max(0, externalDuration) : 0;
    remaining = Math.min(limit, Math.max(0, args.remainingTime ?? limit));
    open = args.isOpen ?? true;
    running = false;
    outcome = "Ready";
  });

  $effect(() => {
    if (!running) return;
    let previous = performance.now();
    let frame: number;
    function advance(now: number) {
      remaining = Math.max(0, remaining - (now - previous) / 1000);
      previous = now;
      if (remaining > 0) frame = requestAnimationFrame(advance);
      else {
        running = false;
        outcome = "Time elapsed";
      }
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  });

  function reset() {
    running = false;
    remaining = total;
    open = true;
    outcome = "Ready";
  }

  function start() {
    if (!open || remaining <= 0) reset();
    if (total <= 0) return;
    running = true;
    outcome = "Running";
  }

  function pause() {
    running = false;
    outcome = "Paused";
  }

  // Reading the editable duration here must not restart the frame effect.
  const total = $derived(Number.isFinite(duration) ? Math.max(0, duration ?? 0) : 0);
</script>

<div class="timer-demo">
  <label class="timer-demo-duration">
    Duration (seconds)
    <input type="number" min="0" step="1" value={duration} oninput={(event) => { duration = event.currentTarget.valueAsNumber; reset(); }} disabled={running} />
  </label>
  <AlertPopupTimer {...args} duration={total} remainingTime={remaining} bind:isOpen={open}
    onundoclick={(event) => { running = false; outcome = "Undone — timer stopped"; args.onundoclick?.(event); }}
    onclose={(event) => { running = false; outcome = "Dismissed"; args.onclose?.(event); }}>
    Comment or other text of the notification with non-blocking information
  </AlertPopupTimer>
  <div class="timer-demo-controls">
    <Button size="extra small" labelText={outcome === "Paused" ? "Resume" : "Start"} onclick={start} state={running || total <= 0 ? "disabled" : "default"} />
    <Button size="extra small" labelText="Pause" onclick={pause} state={running ? "default" : "disabled"} />
    <Button size="extra small" labelText="Reset" onclick={reset} />
  </div>
  <p class="timer-demo-outcome" role="status">{outcome}</p>
</div>

<style>
  .timer-demo { display: grid; gap: 24px; width: 480px; max-width: 100%; font-family: var(--stylos-font-family-normal); }
  .timer-demo-duration { display: grid; gap: 8px; justify-items: start; }
  .timer-demo-duration input { font: inherit; }
  .timer-demo-controls { display: flex; flex-wrap: wrap; gap: 8px; }
  .timer-demo-outcome { margin: 0; }
</style>
