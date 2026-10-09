<script lang="ts">
  import "@stylos/ui/prose.css";
  let { textStyle = "text/base/medium" }: { textStyle?: string } = $props();
</script>

<!-- Plain semantic HTML: no text wrappers or per-element typography classes. -->
<article class="stylos-prose" data-text-style={textStyle}>
  <h1>Working together</h1>
  <p>A shared workspace brings people, decisions and project updates into one place.</p>
  <p>Start with a clear description of the project.</p>
  <h2>Invite your team</h2>
  <p>Choose the access each member needs.</p>
  <h3>Before sending an invitation</h3>
  <p>Check the email address and choose a role.</p>
  <h4>Access overview</h4>
  <p>Owners manage the project. Editors update content. Viewers read content.</p>
  <h5>Automation</h5>
  <p>Review the current team before changing access.</p>
  <h6>Need help?</h6>
  <p>Contact the project owner if you need a different role.</p>
  <p>This document uses the same elements produced by a Markdown renderer.</p>
</article>
