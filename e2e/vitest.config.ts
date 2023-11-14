/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60 * 5,
        include: ['./e2e/**/*.test.ts'],
        hookTimeout: 60 * 1000,
        threads: false
    }
})
