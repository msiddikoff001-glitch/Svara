import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite config.
 *
 * The `@/*` alias mirrors the one declared in `tsconfig.json` so editors
 * and the build resolve the same paths. Without this, TS would accept
 * `import x from '@/store'` but Vite would fail at runtime.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lottie-web')) return 'lottie';
            if (id.includes('react') || id.includes('scheduler')) return 'react';
            return 'vendor';
          }
        },
      },
    },
  },
});
