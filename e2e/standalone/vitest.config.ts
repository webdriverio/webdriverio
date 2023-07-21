/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60,
        include: ['./**/*.e2e.ts'],
        hookTimeout: 60 * 1000,
        threads: false
    }
})
