import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/robots.txt': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Root-level bait routes
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/backup': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/private': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/staging': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

