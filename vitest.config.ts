import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/backend/**/*.ts', 'src/common/**/*.ts'],
      exclude: ['src/backend/integrations/**'],
      reporter: ['text', 'html'],
    },
  },
});
