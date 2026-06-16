import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        hookTimeout: 30000,
        env: {
            NODE_ENV: 'test',
            JWT_SECRET: 'test-secret',
            JWT_EXPIRES_IN: '7d',
            CORS_ORIGIN: 'http://localhost:5173',
        },
    },
})
