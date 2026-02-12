/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  define: {
    // sockjs-client (and others) expect Node's `global`; browsers have globalThis
    global: 'globalThis',
  },
  server: {
    proxy: {
      // Use 127.0.0.1 to avoid IPv6 localhost vs IPv4 backend mismatch (connection refused on macOS)
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/ws': { target: 'http://127.0.0.1:8080', ws: true },
      '/uploads': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
})
