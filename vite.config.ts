import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  preview: {
    allowedHosts: true,
    headers: {
      // CSP Removed temporarily to debug blocking issues
    }
  }
})

