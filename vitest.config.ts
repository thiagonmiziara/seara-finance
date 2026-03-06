import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
        reporter: ['text', 'html'],
      },
    },
  }),
);
