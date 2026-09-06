import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// TypeScript inside .svelte script blocks — Svelte 5 does not strip types
// itself; svelte-package and svelte-check read this config.
export default { preprocess: vitePreprocess() };
