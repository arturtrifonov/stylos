import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  framework: "@storybook/svelte-vite",
  stories: ["../stories/**/*.stories.svelte"],
  // addon-docs renders the autodocs pages the generated stories request —
  // their description text comes from the registry entry, never authored here.
  addons: ["@storybook/addon-svelte-csf", "@storybook/addon-docs"],
};

export default config;
