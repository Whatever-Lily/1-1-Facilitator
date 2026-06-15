import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
    fs: {
      strict: false,
      allow: [
        '/Users/LYU1/Library/CloudStorage/OneDrive-VFCCorp/Documents/1:1 Facilitator',
      ],
    },
  },
  build: {
    outDir: 'dist',
  },
})
