import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // In dev/e2e we want to import the TS sources directly so Playwright's
      // dev server doesn't require a prior build of @ifrm/core.
      '@ifrm/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
    },
  },
});
