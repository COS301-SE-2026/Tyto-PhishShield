import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH ||'/',
    test: {
      globals: true,
      environment: 'jsdom',
      coverage: {
        provider: 'v8'
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://api-gateway:3001',
          changeOrigin: true,
        },
        '/socket.io': {     // Socket.IO handshake path (needed for xp-socket.ts live XP updates)
          target: 'http://api-gateway:3001',
          changeOrigin: true,
          ws: true,
        },
      }
    },
    preview: {
      port: 5173,
      strictPort: true,
    },
  }
});
