import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/envSetup.js', './tests/setup.js'],
    globalSetup: './tests/globalSetup.js',
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially since they share a single test database
    fileParallelism: false,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
});
