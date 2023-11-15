/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60 * 20,
        include: ['./e2e/**/*.test.ts'],
        hookTimeout: 60 * 1000,
        threads: false
    }
})
