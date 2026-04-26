/**
 * @file vitest.config.js
 * @description Global configuration for the Vitest test runner.
 * Sets the testing environment to Node.js and registers the global setup file
 * which initializes the in-memory MongoDB server before any tests run.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global variables like describe, it, expect without importing them everywhere
    globals: true,
    // Specify the environment as Node.js (we are testing a backend API)
    environment: 'node',
    // Path to the setup file that runs before all test suites
    setupFiles: ['./tests/setup.js'],
    // Allow up to 30 seconds for hooks (vital for downloading MongoDB binaries on the first run)
    hookTimeout: 30000, 
  },
});