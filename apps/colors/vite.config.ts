import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [svelte()],
  resolve: {
    alias: { shared: fileURLToPath(new URL('./src/huetone/shared', import.meta.url)) },
  },
  build: { outDir: 'dist' },
  worker: { format: 'es' },
})
