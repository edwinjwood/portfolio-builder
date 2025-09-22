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
      // Use an env-set API backend if provided; fallback to localhost for local dev
      '/api': process.env.VITE_API_PROXY || 'http://localhost:5001'
    }
  }
})
