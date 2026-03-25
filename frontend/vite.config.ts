import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls sang FastAPI backend khi dev
      '/auth': 'http://127.0.0.1:8000',
      '/songs': 'http://127.0.0.1:8000',
      '/playlists': 'http://127.0.0.1:8000',
    },
  },
})
