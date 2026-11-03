<script lang="ts">
  // An alert announces through this span, not through its own section: opening
  // inserts the heading, content and buttons at once, and Orca 50.3 speaks only
  // the first of a burst of insertions — usually a button, which it does not
  // speak. One text node in a plain live element is one insertion, and Orca
  // exempts a live section from that filter, so alerts opening together are all
  // heard (verification/orca-2026-11-03.md). The state at mount is not
  // announced: a region that arrives filled is not, in any browser.
  import type { Attachment } from "svelte/attachments";
  import { alertMessage } from "./alert.ts";
  let { isOpen, politeness, headingText = "", withContent = false }:
    { isOpen: boolean; politeness: "polite" | "assertive"; headingText?: string; withContent?: boolean } = $props();
  let mounted = false;
  // Runs again whenever the alert opens, closes or changes its heading.
  const announce: Attachment<HTMLElement> = announcer => {
    const open = isOpen, heading = headingText, details = withContent;
    if (!mounted) { mounted = true; return; }
    if (!open) { announcer.textContent = ""; return; }
    const content = details ? announcer.parentElement?.querySelector<HTMLElement>(":scope > .stylos-alert-body > .stylos-alert-content") : null;
    announcer.textContent = alertMessage(heading, content?.innerText ?? "");
    // Emptied once spoken, so reading the page does not meet the text twice.
    const clear = setTimeout(() => { announcer.textContent = ""; }, 7000);
    return () => clearTimeout(clear);
  };
</script>

<span class="stylos-alert-announcer" aria-live={politeness} aria-atomic="true" {@attach announce}></span>
