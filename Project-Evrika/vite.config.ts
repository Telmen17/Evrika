import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.riv'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  /** Emit asset files instead of inlining — Matter.js sprites need fetchable URLs. */
  build: {
    assetsInlineLimit: 0,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/frontend/setup/vitest.setup.ts'],
    include: ['tests/frontend/**/*.{test,spec}.{ts,tsx}'],
    css: true,
  },
})
