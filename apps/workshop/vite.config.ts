import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Explicit rather than relying on @storybook/svelte-vite's auto-detection,
// which does not add the plugin under Vite 8 and leaves .svelte files to the
// plain JS parser.
export default defineConfig({
  plugins: [svelte()],
});
