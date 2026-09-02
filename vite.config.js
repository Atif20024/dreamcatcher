import { defineConfig } from 'vite';

// base must match the GitHub Pages URL: https://<user>.github.io/dreamcatcher/
export default defineConfig({
  base: '/dreamcatcher/',
  // the preview tool hands out a free port via PORT when 5173 is taken
  server: { port: Number(process.env.PORT) || 5173, strictPort: false },
});
