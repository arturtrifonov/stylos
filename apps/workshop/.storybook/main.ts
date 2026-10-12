import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  framework: "@storybook/svelte-vite",
  stories: ["../stories/**/*.stories.svelte"],
  // Svelte CSF 5.1.3 omits the explicit meta id from its index output.
  // Keep the original component IDs while grouping titles by Figma page.
  experimental_indexers: async indexers => (indexers ?? []).map(indexer => ({
    ...indexer,
    createIndex: async (file, options) => (await indexer.createIndex(file, options)).map(entry => {
      const component = entry.title?.match(/^Components\/[^/]+\/([^/]+)$/)?.[1];
      return component ? { ...entry, metaId: `components-${component.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` } : entry;
    }),
  })),
  // addon-docs renders the autodocs pages the generated stories request —
  // their description text comes from the registry entry, never authored here.
  addons: ["@storybook/addon-svelte-csf", "@storybook/addon-docs"],
};

export default config;
