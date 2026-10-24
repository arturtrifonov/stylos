<script lang="ts">
  import { Button, Icon, Link } from "@stylos/ui";
</script>

{#snippet arrow()}<Icon name="arrow_forward" />{/snippet}

<div class="cards">
  <article class="card stylos-link-area" data-example="expanded">
    <h3><Link href="#atlas" labelText="Atlas" hasExpandedHitArea hasTrailingIcon trailingIcon={arrow} /></h3>
    <p>The card opens Atlas. Save remains a separate action.</p>
    <div class="stylos-link-area-action"><Button labelText="Save project" /></div>
    <div class="stylos-link-area-action"><Link href="#activity" labelText="View activity" /></div>
  </article>
  <article class="card stylos-link-area" data-example="neighbour">
    <Link href="#boreal" labelText="Boreal" hasExpandedHitArea />
    <p>This card owns a separate stacking context.</p>
  </article>
  <article class="card stylos-link-area" data-example="disabled">
    <h3><Link href="#disabled" labelText="Unavailable project" hasExpandedHitArea state="disabled" /></h3>
    <p>The disabled link supplies no card target.</p>
    <div class="stylos-link-area-action"><Button labelText="Request access" /></div>
  </article>
  <article class="card stylos-link-area" data-example="ordinary">
    <h3><Link href="#ordinary" labelText="Ordinary link" hasTrailingIcon trailingIcon={arrow} /></h3>
    <p>Only the ordinary link itself is a target.</p>
  </article>
</div>

<style>
  .cards {
    display: grid;
    gap: var(--stylos-dimension-gap-g-2_000);
    max-width: 40rem;
  }

  .card {
    padding: var(--stylos-dimension-gap-g-2_000);
    border: var(--stylos-border-width-thin) solid var(--stylos-color-border-default);
    border-radius: var(--stylos-radius-small);
    background-color: var(--stylos-color-background-base);
  }

  .card h3 {
    margin: 0;
  }

  [data-example="neighbour"] {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .stylos-link-area-action {
    width: fit-content;
  }
</style>
