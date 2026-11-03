import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      shared: fileURLToPath(new URL('./src/huetone/shared', import.meta.url)),
      store: fileURLToPath(new URL('./src/huetone/store', import.meta.url)),
    },
  },
  build: { outDir: 'dist' },
  worker: { format: 'es' },
})
