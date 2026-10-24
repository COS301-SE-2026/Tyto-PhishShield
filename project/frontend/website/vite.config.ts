import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import posthog from '@posthog/rollup-plugin'

const packageJson = createRequire(import.meta.url)('./package.json') as {
  name: string;
  version: string;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  const posthogUploadEnabled = mode === 'production'
    && Boolean(process.env.POSTHOG_API_KEY)
    && Boolean(process.env.POSTHOG_PROJECT_ID)
    && Boolean(process.env.POSTHOG_HOST);

  return {
    plugins: [
      react(),
      ...(posthogUploadEnabled ? [posthog({
        personalApiKey: process.env.POSTHOG_API_KEY!,
        projectId: process.env.POSTHOG_PROJECT_ID,
        host: process.env.POSTHOG_HOST,
        sourcemaps: {
          enabled: true,
          releaseName: packageJson.name,
          releaseVersion: packageJson.version,
          deleteAfterUpload: true,
        },
      })] : []),
    ],
    base: env.VITE_BASE_PATH ||'/',
    build: {
      sourcemap: 'hidden',
    },
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
