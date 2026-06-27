import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.riv'],
  /** Emit asset files instead of inlining — Matter.js sprites need fetchable URLs. */
  build: {
    assetsInlineLimit: 0,
  },
})
