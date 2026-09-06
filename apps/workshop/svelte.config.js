import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// TypeScript inside .svelte script blocks — Svelte 5 does not strip types
// itself, so both the workshop and @stylos/ui preprocess through Vite.
export default { preprocess: vitePreprocess() };
