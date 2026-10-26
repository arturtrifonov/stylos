<script lang="ts">
  import { Accordion, AlertInline, AlertPopup, AlertPopupTimer, InputSearch, ProgressBar,
    Switcher, SwitcherItem, TabsHorizontal, TabItem, TextArea, Button } from "@stylos/ui";
  let query = $state("");
  let notes = $state("");
  let mode = $state("list");
  let tab = $state("overview");
  let status = $state("");
  let inlineOpen = $state(true);
  let popupOpen = $state(true);
  let timerOpen = $state(true);
  const id = $props.id();
</script>

<form onsubmit={event => { event.preventDefault(); status = JSON.stringify([...new FormData(event.currentTarget)]); }}>
  <div class="starting-grid">
    <section><h2>Input Search</h2><InputSearch labelText="Search workspaces" name="query" bind:value={query} /></section>
    <section><h2>Switcher</h2><Switcher name="view" accessibleName="Workspace view" bind:value={mode}>
      <SwitcherItem value="list" labelText="List" /><SwitcherItem value="archived" labelText="Archived" state="disabled" /><SwitcherItem value="grid" labelText="Grid" />
    </Switcher><p>View: {mode}</p></section>
    <section><h2>Text Area</h2><TextArea name="notes" labelText="Workspace notes" bind:value={notes} hasCounterText maxlength={1000} /></section>
    <section><h2>Progress Bar</h2><ProgressBar value="30" accessibleName="Workspace import" /></section>
    <section><h2>Accordion</h2><Accordion labelText="Advanced settings"><InputSearch labelText="Search advanced settings" /></Accordion></section>
    <section><h2>Tabs Horizontal</h2><TabsHorizontal bind:value={tab} accessibleName="Workspace details">
      {#snippet tabsSlot()}
        <TabItem value="overview" labelText="Overview" id={`${id}-overview`} controls={`${id}-panel-overview`} />
        <TabItem value="unavailable" labelText="Unavailable" state="disabled" />
        <TabItem value="activity" labelText="Activity" id={`${id}-activity`} controls={`${id}-panel-activity`} />
      {/snippet}
      {#snippet panelsSlot()}
        <div role="tabpanel" tabindex="0" id={`${id}-panel-overview`} aria-labelledby={`${id}-overview`} hidden={tab !== "overview"}>Workspace overview</div>
        <div role="tabpanel" tabindex="0" id={`${id}-panel-activity`} aria-labelledby={`${id}-activity`} hidden={tab !== "activity"}>Workspace activity</div>
      {/snippet}
    </TabsHorizontal></section>
    <section><h2>Alert Inline</h2><AlertInline bind:isOpen={inlineOpen} hasCloseButton hasIcon={false} headingText="Workspace imported"
      onprimaryclick={() => { status = "Inline accepted"; }} onsecondaryclick={() => { status = "Inline cancelled"; }}>Your workspace is ready.</AlertInline></section>
    <section><h2>Alert Popup</h2><AlertPopup bind:isOpen={popupOpen} hasIcon={false} headingText="Workspace updated"
      onprimaryclick={() => { status = "Popup accepted"; }} onsecondaryclick={() => { status = "Popup cancelled"; }}>Changes were saved.</AlertPopup></section>
    <section><h2>Alert Popup Timer</h2><AlertPopupTimer bind:isOpen={timerOpen} headingText="Workspace archived"
      onundoclick={() => { status = "Archive undone"; timerOpen = false; }} /></section>
  </div>
  <Button type="submit" labelText="Submit workspace" /><Button type="reset" variant="outline" labelText="Reset workspace" />
  <Button variant="outline" labelText="Show notifications" onclick={() => { inlineOpen = true; popupOpen = true; timerOpen = true; }} />
  <p role="status">{status}</p>
</form>

<style>
  .starting-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap: 24px; margin-block-end: 24px; }
  section { min-width: 0; }
  h2 { font: 16px system-ui; margin-block: 0 12px; }
  [role="tabpanel"] { padding-block: 12px; }
</style>
