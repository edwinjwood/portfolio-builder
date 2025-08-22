import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['react-frontend-production-eb50.up.railway.app']
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001'
    }
  }
})
