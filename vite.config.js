import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false
  },
  server: {
    proxy: {
      '/nyc-open-data': {
        target: 'https://data.cityofnewyork.us',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/nyc-open-data/, '')
      }
    }
  }
});
