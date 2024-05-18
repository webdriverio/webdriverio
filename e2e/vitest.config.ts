import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60 * 3,
        include: ['./e2e/*.test.ts'],
        hookTimeout: 60 * 1000
    }
})
