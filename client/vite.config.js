import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy: forward /api and the /voice WebSocket to the Express server
// so the browser only talks to one origin during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/voice': { target: 'ws://localhost:3001', ws: true },
    },
  },
});
