import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server (npm run server) is optional during development: free study works without it.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } } },
  preview: { port: 4173, strictPort: true, proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } } },
  build: { outDir: 'dist', sourcemap: true, target: 'es2022' },
});
