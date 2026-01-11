import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 3001,
    // Removed proxy - frontend connects directly to backend using window.location.hostname
    // This allows it to work from any PC on the network
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  preview: {
    host: '0.0.0.0', // Allow access from network
    port: 3001
  }
})
