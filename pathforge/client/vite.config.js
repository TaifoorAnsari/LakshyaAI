import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration
 * 
 * - React plugin for JSX transform and Fast Refresh
 * - Path alias: '@/' maps to 'src/' so imports are clean
 *   (e.g. import Button from '@/components/Button')
 * - Proxy: '/api' requests forward to the Express backend
 *   in dev mode, avoiding CORS issues during development
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
