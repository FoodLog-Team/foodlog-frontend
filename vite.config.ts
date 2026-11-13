import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // The backend has CORS disabled, so in development the browser talks to the Vite
  // server and requests under /api are proxied to the backend (same origin → the
  // HttpOnly refresh-token cookie works without CORS).
  const proxy = {
    '/api': {
      target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080',
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
